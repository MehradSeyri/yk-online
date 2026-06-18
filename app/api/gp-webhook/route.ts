import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { gpExtractStatus, gpIsPaid, gpIsFailed } from "@/lib/gp";
import {
  recordIdempotency,
  recordMetric,
  alreadyConfirmed,
  confirmAndForward,
} from "@/lib/webhook-core";
import type { ShopWebhookPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pick(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const env = getEnv();
  const url = new URL(req.url);

  // 1. Verify token.
  const token = url.searchParams.get("token");
  if (!token || token !== env.GP_WEBHOOK_TOKEN) {
    log.warn("gp-webhook.bad_token", {});
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Optional signature header (logged; GP signs via X-GP-Signature when set).
  const signature = req.headers.get("x-gp-signature");

  // 3. Parse defensively.
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    log.warn("gp-webhook.bad_json", {});
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  log.info("gp-webhook.received", { hasSignature: Boolean(signature) });

  // GP nests transaction fields in some webhook shapes; flatten common ones.
  const action = (payload.action as Record<string, unknown>) || {};
  const paymentMethod =
    (payload.payment_method as Record<string, unknown>) || {};
  const card = (paymentMethod.card as Record<string, unknown>) || {};
  const customer = (payload.payer as Record<string, unknown>) ||
    (payload.customer as Record<string, unknown>) || {};

  const status = gpExtractStatus(payload);
  const orderId =
    pick(payload, "reference", "order_id", "merchant_reference") || "";
  const transactionId =
    pick(payload, "id", "transaction_id") || pick(action, "id") || "";
  const linkId = pick(payload, "link_id") || pick(payload, "id") || null;
  const amountStr = pick(payload, "amount") || pick(action, "amount") || "0";
  const amount = Number(amountStr) || 0;
  const currency = (pick(payload, "currency") || "").toUpperCase();
  const email =
    pick(customer, "email") || pick(payload, "email") || "";
  const fullName =
    pick(customer, "name") ||
    [pick(customer, "first_name"), pick(customer, "last_name")]
      .filter(Boolean)
      .join(" ") ||
    pick(card, "name") ||
    "";

  log.info("gp-webhook.parsed", {
    orderId,
    transactionId,
    status,
    amount,
    currency,
  });

  if (!orderId) {
    // Nothing actionable; ack so GP does not hammer retries.
    log.warn("gp-webhook.no_order_ref", { status });
    return NextResponse.json({ ok: true });
  }

  // 4. Idempotency key + dedup.
  const idempotencyKey = `${transactionId}:${status}:${amount}`;
  const { fresh } = await recordIdempotency({
    provider: "globalpayments",
    idempotencyKey,
    orderId,
    transactionId,
    eventType: status,
    payload,
  });
  if (!fresh) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 5. Status mapping.
  if (gpIsPaid(status)) {
    // Monotonic: if already confirmed, ack without re-forwarding.
    if (await alreadyConfirmed(orderId)) {
      log.info("gp-webhook.already_confirmed", { orderId });
      return NextResponse.json({ ok: true, alreadyConfirmed: true });
    }

    const forwardPayload: ShopWebhookPayload = {
      provider: "globalpayments",
      orderId,
      status: "paid",
      transactionId,
      providerRef: linkId || transactionId,
      amount,
      currency: currency || "EUR",
      email,
      fullName,
    };

    const ok = await confirmAndForward(forwardPayload);
    if (!ok) {
      // Force GP to retry the webhook.
      return NextResponse.json(
        { error: "Forward to shop failed" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, forwarded: true });
  }

  if (gpIsFailed(status)) {
    await recordMetric({
      provider: "globalpayments",
      orderId,
      status: "failed",
      transactionId,
      orderCode: linkId,
      amountCents: amount,
      currency,
      rawPayload: payload,
    });
    return NextResponse.json({ ok: true });
  }

  // PENDING / AUTHORIZED / PREAUTHORIZED -> waiting state, do not forward paid.
  log.info("gp-webhook.pending", { orderId, status });
  return NextResponse.json({ ok: true, pending: true });
}
