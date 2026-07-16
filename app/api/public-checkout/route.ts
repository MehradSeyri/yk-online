import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/providers";
import { getEnv } from "@/lib/env";
import { normalizeLang } from "@/lib/lang";
import { log } from "@/lib/logger";
import { recordMetric } from "@/lib/webhook-core";
import { toMinorUnits } from "@/lib/gp";
import { validateCoupon, applyDiscount } from "@/lib/coupons";
import type { CreatePaymentInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function createPublicOrderId(): string {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BBBWEB-${ts}-${rnd}`;
}

export async function POST(req: NextRequest) {
  const env = getEnv();

  // Basic origin check for browser flow (defense-in-depth).
  const origin = req.headers.get("origin") || "";
  const self = new URL(env.SELF_URL).origin;
  if (origin && origin !== self) {
    log.warn("public-checkout.bad_origin", { origin, self });
    return bad("Invalid origin", 403);
  }

  let body: {
    productName?: string;
    amount?: number;
    currency?: string;
    lang?: string;
    couponCode?: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    countryCode?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return bad("Invalid JSON body");
  }

  const productName = typeof body.productName === "string" ? body.productName.trim() : "";
  const amount = typeof body.amount === "number" ? body.amount : NaN;
  const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
  const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim() : "";
  const countryCode =
    typeof body.countryCode === "string" ? body.countryCode.trim().toUpperCase() : undefined;

  if (!productName) return bad("productName is required");
  if (!Number.isFinite(amount) || amount <= 0) return bad("amount must be a positive number");
  if (!currency || currency.length !== 3) return bad("currency must be ISO alpha-3");

  // Server-side coupon validation — authoritative, client cannot bypass.
  let finalAmount = amount;
  let discountPct = 0;
  if (couponCode) {
    const pct = validateCoupon(couponCode);
    if (pct !== null) {
      discountPct = pct;
      finalAmount = applyDiscount(amount, pct);
      if (finalAmount < 0.01) finalAmount = 0.01;
    } else {
      return bad("Invalid coupon code", 400);
    }
  }

  const orderId = createPublicOrderId();
  const input: CreatePaymentInput = {
    orderId,
    amount: finalAmount,
    currency,
    lang: body.lang,
    countryCode,
    customerTrns: productName,
    customerEmail: body.customerEmail,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
  };

  log.info("public-checkout.start", {
    orderId,
    productName,
    amount: toMinorUnits(finalAmount),
    originalAmount: toMinorUnits(amount),
    discountPct,
    couponCode: couponCode || undefined,
    currency,
    primary: env.PAYMENT_PROVIDER_PRIMARY,
  });

  try {
    const result = await createPayment(input);

    await recordMetric({
      provider: result.provider,
      orderId,
      status: "initiated",
      orderCode: result.providerRef,
      amountCents: toMinorUnits(finalAmount),
      currency,
      lang: normalizeLang(input.lang),
      rawPayload: {
        source: "bbb-direct-web",
        productName,
      },
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      provider: result.provider,
      providerRef: result.providerRef,
      orderId,
    });
  } catch (err) {
    log.error("public-checkout.fail", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return bad("Failed to create payment", 502);
  }
}
