import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";
import { comgateGetStatus } from "@/lib/comgate";
import {
  alreadyConfirmed,
  confirmLocalOnly,
  confirmAndForward,
  isLocalDirectOrder,
  recordIdempotency,
  recordMetric,
} from "@/lib/webhook-core";
import type { ShopWebhookPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readParams(req: NextRequest): Promise<URLSearchParams> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    return new URLSearchParams(text);
  }
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, unknown>;
    const out = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null) out.set(k, String(v));
    }
    return out;
  }
  return new URL(req.url).searchParams;
}

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const params = await readParams(req);

  const transId = params.get("transId") || params.get("id") || "";
  const refId = params.get("refId") || params.get("orderId") || "";
  const incomingStatus = (params.get("status") || "").toUpperCase();

  if (!transId || !refId) {
    log.warn("comgate-webhook.missing_ids", {
      transId,
      refId,
      incomingStatus,
    });
    return NextResponse.json({ ok: true, ignored: true, reason: "missing-ids" });
  }

  const idempotencyKey = `${transId}:${incomingStatus || "unknown"}:${refId}`;
  const { fresh } = await recordIdempotency({
    provider: "comgate",
    idempotencyKey,
    orderId: refId,
    transactionId: transId,
    eventType: incomingStatus || null,
    payload: Object.fromEntries(params.entries()),
  });

  if (!fresh) {
    if (await alreadyConfirmed(refId)) {
      return NextResponse.json({ ok: true, duplicate: true, alreadyConfirmed: true });
    }
    log.warn("comgate-webhook.duplicate_unconfirmed_retry", {
      transId,
      orderId: refId,
      incomingStatus,
    });
  }

  const verified = await comgateGetStatus(transId);
  if (verified.orderId && verified.orderId !== refId) {
    log.warn("comgate-webhook.ref_mismatch", {
      webhookRefId: refId,
      verifiedRefId: verified.orderId,
      transId,
    });
    return NextResponse.json({ ok: true, ignored: true, reason: "ref-mismatch" });
  }

  if (verified.status === "paid") {
    if (await alreadyConfirmed(refId)) {
      return NextResponse.json({ ok: true, alreadyConfirmed: true });
    }

    const forwardPayload: ShopWebhookPayload = {
      provider: "comgate",
      orderId: refId,
      status: "paid",
      transactionId: verified.transactionId || transId,
      providerRef: transId,
      amount: verified.amountMinor ?? 0,
      currency: verified.currency || "CZK",
      email: verified.email || "",
      fullName: verified.fullName || "",
    };

    if (isLocalDirectOrder(refId)) {
      await confirmLocalOnly(forwardPayload);
      return NextResponse.json({ ok: true, localConfirmed: true });
    }

    const ok = await confirmAndForward(forwardPayload);
    if (!ok) {
      return NextResponse.json({ error: "Forward to shop failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, forwarded: true });
  }

  if (verified.status === "failed") {
    await recordMetric({
      provider: "comgate",
      orderId: refId,
      status: "failed",
      transactionId: transId,
      orderCode: transId,
      amountCents: verified.amountMinor ?? null,
      currency: verified.currency ?? null,
      eventId: incomingStatus || null,
      rawPayload: verified.raw,
    });
    return NextResponse.json({ ok: true, failed: true });
  }

  return NextResponse.json({ ok: true, pending: true });
}
