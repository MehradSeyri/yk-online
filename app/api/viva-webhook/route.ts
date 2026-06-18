import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { vivaIsPaid } from "@/lib/viva";
import {
  recordIdempotency,
  recordMetric,
  alreadyConfirmed,
  confirmAndForward,
} from "@/lib/webhook-core";
import type { ShopWebhookPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Viva ISO-numeric -> alpha-3 currency for the normalized forward payload.
const NUMERIC_TO_ALPHA: Record<string, string> = {
  "978": "EUR",
  "203": "CZK",
  "840": "USD",
  "826": "GBP",
  "985": "PLN",
  "348": "HUF",
  "946": "RON",
  "975": "BGN",
};

function num(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
    return Number(v);
  return null;
}

/** GET: Viva webhook verification handshake. */
export async function GET() {
  const env = getEnv();
  return NextResponse.json({ Key: env.VIVA_WEBHOOK_KEY });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    log.warn("viva-webhook.bad_json", {});
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventTypeId = num(body.EventTypeId);
  const data = (body.EventData as Record<string, unknown>) || {};

  const statusId =
    typeof data.StatusId === "string" ? data.StatusId : null;
  const orderCode =
    data.OrderCode !== undefined && data.OrderCode !== null
      ? String(data.OrderCode)
      : null;
  const transactionId =
    typeof data.TransactionId === "string" ? data.TransactionId : "";
  const orderId =
    typeof data.MerchantTrns === "string" ? data.MerchantTrns : "";
  const amountMajor = num(data.Amount) ?? 0;
  const amountCents = Math.round(amountMajor * 100);
  const currencyNumeric =
    data.CurrencyCode !== undefined ? String(data.CurrencyCode) : "";
  const currency = NUMERIC_TO_ALPHA[currencyNumeric] || currencyNumeric || "EUR";
  const email = typeof data.Email === "string" ? data.Email : "";
  const fullName = typeof data.FullName === "string" ? data.FullName : "";

  log.info("viva-webhook.received", {
    orderId,
    orderCode,
    transactionId,
    eventTypeId,
    statusId,
  });

  // Idempotency: TransactionId : EventTypeId : StatusId.
  const idempotencyKey = `${transactionId}:${eventTypeId}:${statusId}`;
  const { fresh } = await recordIdempotency({
    provider: "viva",
    idempotencyKey,
    orderId: orderId || null,
    transactionId: transactionId || null,
    eventType: eventTypeId !== null ? String(eventTypeId) : null,
    payload: body,
  });
  if (!fresh) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!orderId) {
    log.warn("viva-webhook.no_merchant_trns", { orderCode, eventTypeId });
    return NextResponse.json({ ok: true });
  }

  // Strict paid condition: EventTypeId 1796 + StatusId 'F'.
  if (vivaIsPaid(eventTypeId, statusId)) {
    if (await alreadyConfirmed(orderId)) {
      log.info("viva-webhook.already_confirmed", { orderId });
      return NextResponse.json({ ok: true, alreadyConfirmed: true });
    }

    const forwardPayload: ShopWebhookPayload = {
      provider: "viva",
      orderId,
      status: "paid",
      transactionId,
      providerRef: orderCode || transactionId,
      amount: amountCents,
      currency,
      email,
      fullName,
    };

    const ok = await confirmAndForward(forwardPayload);
    if (!ok) {
      return NextResponse.json(
        { error: "Forward to shop failed" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, forwarded: true });
  }

  // Any non-paid event: record metric, do not forward paid.
  await recordMetric({
    provider: "viva",
    orderId,
    status: "failed",
    transactionId,
    orderCode,
    amountCents,
    currency,
    eventId: eventTypeId !== null ? String(eventTypeId) : null,
    rawPayload: body,
  });
  return NextResponse.json({ ok: true });
}
