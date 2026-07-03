import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { recordMetric } from "@/lib/webhook-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const env = getEnv();
  const url = new URL(req.url);
  const transId = url.searchParams.get("transId") || url.searchParams.get("id") || null;
  const refId = url.searchParams.get("refId") || null;

  let orderId = refId || "";
  if (!orderId && transId) {
    const ev = await prisma.paymentEvent.findFirst({
      where: { provider: "comgate", orderCode: transId },
      orderBy: { createdAt: "desc" },
      select: { orderId: true },
    });
    orderId = ev?.orderId ?? "";
  }

  if (orderId) {
    await recordMetric({
      provider: "comgate",
      orderId,
      status: "success",
      orderCode: transId,
      transactionId: transId,
    });
  }

  log.info("comgate.success_redirect", { orderId, transId });
  const target = `${env.SHOP_DOMAIN}/payment/success?order=${encodeURIComponent(orderId)}`;
  return NextResponse.redirect(target, 302);
}
