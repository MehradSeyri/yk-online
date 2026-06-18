import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { recordMetric } from "@/lib/webhook-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Viva customer return URL (failure/cancel). Viva appends ?s=<orderCode>&t=<txId>.
 * UX + metric only. Always 302 to AAA.CZ.
 */
export async function GET(req: NextRequest) {
  const env = getEnv();
  const url = new URL(req.url);
  const orderCode = url.searchParams.get("s") || null;
  const transactionId = url.searchParams.get("t") || null;

  let orderId = "";
  if (orderCode) {
    const ev = await prisma.paymentEvent.findFirst({
      where: { provider: "viva", orderCode },
      orderBy: { createdAt: "desc" },
      select: { orderId: true },
    });
    orderId = ev?.orderId ?? "";
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
  log.info("viva.fail_redirect", { orderId, orderCode });

  const target = `${env.SHOP_DOMAIN}/payment/failed?order=${encodeURIComponent(
    orderId
  )}`;
  return NextResponse.redirect(target, 302);
}
