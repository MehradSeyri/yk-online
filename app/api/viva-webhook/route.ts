import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { vivaGetOrderStatus, vivaIsPaid } from "@/lib/viva";
import {
  recordIdempotency,
  recordMetric,
  alreadyConfirmed,
  confirmLocalOnly,
  confirmAndForward,
  isLocalDirectOrder,
} from "@/lib/webhook-core";
import type { ShopWebhookPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Viva IP allowlist – source: https://developer.viva.com/webhooks-for-payments/
// ---------------------------------------------------------------------------
const VIVA_ALLOWED_RANGES: string[] = [
  // Production
  "51.138.37.238",
  "40.127.253.112/28",
  "51.105.129.192/28",
  "20.54.89.16",
  "4.223.76.50",
  "51.12.157.0/28",
  // Demo
  "20.50.240.57",
  "40.74.20.78",
  "195.167.87.181",
  "195.167.87.180",
  "20.13.195.185",
  "135.225.16.50",
];

function ipToUint32(ip: string): number {
  return (
    ip
      .split(".")
      .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0) >>> 0
  );
}

function isVivaIp(raw: string): boolean {
  // Strip port and IPv6-mapped prefix (::ffff:) if present.
  const ip = raw.trim().replace(/^::ffff:/, "").split(":")[0];
  for (const range of VIVA_ALLOWED_RANGES) {
    if (range.includes("/")) {
      const [network, prefixStr] = range.split("/");
      const prefix = parseInt(prefixStr, 10);
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      if ((ipToUint32(ip) & mask) === (ipToUint32(network) & mask)) return true;
    } else if (ip === range) {
      return true;
    }
  }
  return false;
}

function getClientIp(req: NextRequest): string | null {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return null;
}

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

/** GET: Viva webhook verification handshake.
 *
 * Priority:
 *  1. VIVA_WEBHOOK_KEY env var (if set and not the placeholder "tbd")
 *  2. Dynamic fetch from Viva API using OAuth2 Bearer token
 *     (works for Smart Checkout / OAuth2 merchant accounts where
 *      the legacy Basic-auth endpoint returns 404)
 *
 * Viva requires a clean HTTP 200 + {"Key":"..."} – never throws. */
export async function GET() {
  // Fast path: pre-configured static key.
  const staticKey = process.env.VIVA_WEBHOOK_KEY ?? "";
  if (staticKey && staticKey !== "tbd") {
    return NextResponse.json({ Key: staticKey });
  }

  // Dynamic path: fetch the key from Viva using OAuth2 Bearer token.
  try {
    const clientId = process.env.VIVA_CLIENT_ID ?? "";
    const clientSecret = process.env.VIVA_CLIENT_SECRET ?? "";
    if (!clientId || !clientSecret) {
      log.warn("viva-webhook.get_missing_credentials", {});
      return NextResponse.json({ Key: "" });
    }

    const isLive = (process.env.VIVA_ENV ?? "live").toLowerCase() === "live";
    const accountsBase = isLive
      ? "https://accounts.vivapayments.com"
      : "https://demo-accounts.vivapayments.com";
    // Note: webhook key endpoint lives on the legacy merchant API host (www/demo),
    // NOT on the OAuth2 API host (api/demo-api).
    const merchantApiBase = isLive
      ? "https://www.vivapayments.com"
      : "https://demo.vivapayments.com";

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(`${accountsBase}/connect/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      log.warn("viva-webhook.get_token_failed", { status: tokenRes.status, body: body.slice(0, 200) });
      return NextResponse.json({ Key: "" });
    }

    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) {
      log.warn("viva-webhook.get_token_empty", {});
      return NextResponse.json({ Key: "" });
    }

    const keyRes = await fetch(`${merchantApiBase}/api/messages/config/token`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!keyRes.ok) {
      log.warn("viva-webhook.get_key_failed", { status: keyRes.status });
      return NextResponse.json({ Key: "" });
    }

    const keyData = (await keyRes.json()) as { Key?: string };
    log.info("viva-webhook.get_key_ok", {});
    return NextResponse.json({ Key: keyData.Key ?? "" });
  } catch (err) {
    log.warn("viva-webhook.get_key_error", { err: String(err) });
    return NextResponse.json({ Key: "" });
  }
}

export async function POST(req: NextRequest) {
  // IP allowlist: only accept calls from Viva's documented ranges.
  // Skipped in local development to allow testing with curl.
  if (process.env.NODE_ENV === "production") {
    const clientIp = getClientIp(req);
    if (!clientIp || !isVivaIp(clientIp)) {
      log.warn("viva-webhook.ip_blocked", { ip: clientIp ?? "unknown" });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

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

  if (!orderId) {
    log.warn("viva-webhook.no_merchant_trns", { orderCode, eventTypeId });
    return NextResponse.json({ ok: true });
  }

  // Strict paid condition: EventTypeId 1796 + StatusId 'F'.
  if (vivaIsPaid(eventTypeId, statusId)) {
    if (!fresh) {
      // Forward may have failed earlier after idempotency was written.
      // If not confirmed yet, keep processing so provider retries can recover.
      if (await alreadyConfirmed(orderId)) {
        return NextResponse.json({ ok: true, duplicate: true, alreadyConfirmed: true });
      }
      log.warn("viva-webhook.duplicate_unconfirmed_retry", {
        orderId,
        orderCode,
        transactionId,
      });
    }

    // Defense-in-depth: verify paid state with Viva API before forwarding.
    if (!orderCode) {
      log.warn("viva-webhook.paid_missing_order_code", {
        orderId,
        transactionId,
      });
      return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });
    }

    const verified = await vivaGetOrderStatus(orderCode);
    if (verified.status !== "paid") {
      log.warn("viva-webhook.paid_revalidation_failed", {
        orderId,
        orderCode,
        transactionId,
        verifiedStatus: verified.status,
      });
      return NextResponse.json({ ok: true, ignored: true, reason: "revalidation-failed" });
    }

    if (
      transactionId &&
      verified.transactionId &&
      transactionId !== verified.transactionId
    ) {
      log.warn("viva-webhook.tx_mismatch", {
        orderId,
        orderCode,
        webhookTx: transactionId,
        verifiedTx: verified.transactionId,
      });
      return NextResponse.json({ ok: true, ignored: true, reason: "tx-mismatch" });
    }

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

    if (isLocalDirectOrder(orderId)) {
      await confirmLocalOnly(forwardPayload);
      return NextResponse.json({ ok: true, localConfirmed: true });
    }

    const ok = await confirmAndForward(forwardPayload);
    if (!ok) {
      return NextResponse.json(
        { error: "Forward to shop failed" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, forwarded: true });
  }

  if (!fresh) {
    return NextResponse.json({ ok: true, duplicate: true });
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
