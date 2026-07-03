import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { gpGetLinkStatus } from "@/lib/gp";
import { comgateGetStatus } from "@/lib/comgate";
import { vivaGetOrderStatus } from "@/lib/viva";
import {
  recordIdempotency,
  recordMetric,
  alreadyConfirmed,
  confirmLocalOnly,
  confirmAndForward,
  isLocalDirectOrder,
} from "@/lib/webhook-core";
import type { Provider, ShopWebhookPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STALE_MS = 5 * 60 * 1000; // 5 minutes
const BATCH = 50;

/**
 * Reconciliation job (cron, every 10-15 min). Finds `initiated` events with no
 * matching `confirmed`, older than 5 min, and verifies final state via the
 * provider API. Closes gaps where a webhook never arrived.
 */
async function reconcile(): Promise<{
  scanned: number;
  paid: number;
  failed: number;
  pending: number;
}> {
  const before = new Date(Date.now() - STALE_MS);

  const candidates = await prisma.paymentEvent.findMany({
    where: { status: "initiated", createdAt: { lt: before } },
    orderBy: { createdAt: "asc" },
    take: BATCH,
  });

  let paid = 0;
  let failed = 0;
  let pending = 0;

  for (const ev of candidates) {
    const provider = ev.provider as Provider;
    const providerRef = ev.orderCode || "";
    if (!providerRef) {
      pending++;
      continue;
    }

    // Skip if already confirmed elsewhere.
    if (await alreadyConfirmed(ev.orderId)) continue;

    try {
      const result =
        provider === "globalpayments"
          ? await gpGetLinkStatus(providerRef)
          : provider === "comgate"
            ? await comgateGetStatus(providerRef)
            : await vivaGetOrderStatus(providerRef);

      if (result.status === "paid") {
        // Dedup so we never double-forward.
        const txId = result.transactionId || providerRef;
        const { fresh } = await recordIdempotency({
          provider,
          idempotencyKey: `${txId}:reconcile-paid`,
          orderId: ev.orderId,
          transactionId: txId,
          eventType: "reconcile",
          payload: result.raw,
        });
        if (!fresh) continue;

        const forwardPayload: ShopWebhookPayload = {
          provider,
          orderId: ev.orderId,
          status: "paid",
          transactionId: txId,
          providerRef,
          amount: result.amountMinor ?? ev.amountCents ?? 0,
          currency: result.currency ?? ev.currency ?? "EUR",
          email: "",
          fullName: "",
        };

        if (isLocalDirectOrder(ev.orderId)) {
          await confirmLocalOnly(forwardPayload);
          paid++;
          log.info("reconcile.local_paid_confirmed", {
            orderId: ev.orderId,
            provider,
          });
          continue;
        }

        const ok = await confirmAndForward(forwardPayload);
        if (ok) {
          paid++;
          log.info("reconcile.paid_forwarded", {
            orderId: ev.orderId,
            provider,
          });
        } else {
          // Leave as-is; next run retries (no confirmed metric persisted on fail path
          // beyond what confirmAndForward already wrote — dedup key prevents re-forward,
          // so remove it to allow retry).
          await prisma.providerWebhookEvent.deleteMany({
            where: { provider, idempotencyKey: `${txId}:reconcile-paid` },
          });
          log.warn("reconcile.forward_failed_retry_next", {
            orderId: ev.orderId,
          });
        }
      } else if (result.status === "failed") {
        await recordMetric({
          provider,
          orderId: ev.orderId,
          status: "failed",
          orderCode: providerRef,
          rawPayload: result.raw,
        });
        failed++;
      } else {
        pending++;
      }
    } catch (err) {
      pending++;
      log.error("reconcile.candidate_error", {
        orderId: ev.orderId,
        provider,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { scanned: candidates.length, paid, failed, pending };
}

function authorized(req: NextRequest): boolean {
  const env = getEnv();
  // Accept Vercel Cron bearer or internal secret header.
  const auth = req.headers.get("authorization");
  if (env.CRON_SECRET && auth === `Bearer ${env.CRON_SECRET}`) return true;
  const internal = req.headers.get("x-internal-secret");
  if (internal && internal === env.INTERNAL_API_SECRET) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await reconcile();
  log.info("reconcile.done", summary);
  return NextResponse.json({ ok: true, ...summary });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
