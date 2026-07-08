import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { createPayment } from "@/lib/providers";
import { recordMetric } from "@/lib/webhook-core";
import { toMinorUnits } from "@/lib/gp";
import { normalizeLang } from "@/lib/lang";
import { numericToAlpha } from "@/lib/currency";
import type { CreatePaymentInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const env = getEnv();

  // Auth: internal shared secret from AAA.CZ.
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== env.INTERNAL_API_SECRET) {
    log.warn("create-order.unauthorized", {});
    return bad("Unauthorized", 401);
  }

  let body: Partial<CreatePaymentInput>;
  try {
    body = (await req.json()) as Partial<CreatePaymentInput>;
  } catch {
    return bad("Invalid JSON body");
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const amount = typeof body.amount === "number" ? body.amount : NaN;
  const currency =
    typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
  const rawCurrencyCode = (body as any).currencyCode;
  const currencyCode =
    typeof rawCurrencyCode === "number"
      ? rawCurrencyCode
      : typeof rawCurrencyCode === "string" && /^[0-9]+$/.test(rawCurrencyCode)
      ? Number(rawCurrencyCode)
      : undefined;
  const requestLang =
    typeof (body as any).requestLang === "string"
      ? (body as any).requestLang.trim()
      : undefined;

  if (!orderId) return bad("orderId is required");
  if (!Number.isFinite(amount) || amount <= 0)
    return bad("amount must be a positive number");
  if (currency && currency.length !== 3)
    return bad("currency must be ISO alpha-3");
  if (rawCurrencyCode !== undefined && currencyCode === undefined)
    return bad("currencyCode must be a positive integer");

  const effectiveCurrency =
    currency || numericToAlpha(currencyCode) || "";
  if (!effectiveCurrency || effectiveCurrency.length !== 3)
    return bad("currency must be a valid ISO alpha-3 or numeric currencyCode");

  const input: CreatePaymentInput = {
    orderId,
    amount,
    currency: effectiveCurrency,
    currencyCode,
    requestLang,
    countryCode: body.countryCode,
    lang: body.lang,
    customerTrns: body.customerTrns,
    customerEmail: body.customerEmail,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
  };

  log.info("create-order.start", {
    orderId,
    amount: toMinorUnits(amount),
    currency,
    primary: env.PAYMENT_PROVIDER_PRIMARY,
  });

  try {
    const result = await createPayment(input);

    // Metric: initiated. providerRef stored in order_code for later lookup.
    await recordMetric({
      provider: result.provider,
      orderId,
      status: "initiated",
      orderCode: result.providerRef,
      amountCents: toMinorUnits(amount),
      currency,
      countryCode: input.countryCode ?? null,
      lang: normalizeLang(input.requestLang ?? input.lang),
    });

    log.info("create-order.success", {
      orderId,
      provider: result.provider,
      providerRef: result.providerRef,
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      provider: result.provider,
      providerRef: result.providerRef,
    });
  } catch (err) {
    log.error("create-order.fail", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return bad("Failed to create payment", 502);
  }
}
