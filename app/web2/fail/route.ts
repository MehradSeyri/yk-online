import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { recordMetric } from "@/lib/webhook-core";
import { vivaGetOrderStatus } from "@/lib/viva";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function queryParamsForLog(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

/**
 * Viva customer return URL (failure/cancel). Viva appends ?s=<orderCode>&t=<txId>.
 * UX + metric only. Always 302 to AAA.CZ.
 */
export async function GET(req: NextRequest) {
  const env = getEnv();
  const url = new URL(req.url);
  const orderCode = url.searchParams.get("s") || null;
  const transactionId = url.searchParams.get("t") || null;
  const queryParams = queryParamsForLog(url);

  log.info("viva.fail_redirect.received", {
    path: url.pathname,
    queryParams,
    referrer: req.headers.get("referer") || req.headers.get("referrer"),
    userAgent: req.headers.get("user-agent"),
  });

  let orderId = "";
  if (orderCode) {
    const ev = await prisma.paymentEvent.findFirst({
      where: { provider: "viva", orderCode },
      orderBy: { createdAt: "desc" },
      select: { orderId: true },
    });
    orderId = ev?.orderId ?? "";
  }

  if (orderCode) {
    const result = await vivaGetOrderStatus(orderCode);
    log.info("viva.fail_redirect.status_checked", {
      orderId,
      orderCode,
      transactionId,
      queryParams,
      providerStatus: result.status,
    });

    if (result.status === "paid") {
      if (orderId) {
        await recordMetric({
          provider: "viva",
          orderId,
          status: "success",
          orderCode,
          transactionId: result.transactionId || transactionId,
          rawPayload: result.raw,
        });
      }

      const target = `${env.SHOP_DOMAIN}/payment/success?order=${encodeURIComponent(
        orderId
      )}`;
      return NextResponse.redirect(target, 302);
    }
  }

  if (orderId) {
    await recordMetric({
      provider: "viva",
      orderId,
      status: "failed",
      orderCode,
      transactionId,
    });
  }
  log.info("viva.fail_redirect", {
    orderId,
    orderCode,
    transactionId,
    queryParams,
  });

  const target = `${env.SHOP_DOMAIN}/payment/failed?order=${encodeURIComponent(
    orderId
  )}`;
  return NextResponse.redirect(target, 302);
}
