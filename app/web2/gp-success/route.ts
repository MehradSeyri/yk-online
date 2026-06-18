import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { recordMetric } from "@/lib/webhook-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GlobalPayments customer return URL. UX + metric only — never sets paid
 * status (the webhook flow is the source of truth). Always 302 to AAA.CZ.
 */
export async function GET(req: NextRequest) {
  const env = getEnv();
  const url = new URL(req.url);
  const linkId =
    url.searchParams.get("id") || url.searchParams.get("link_id") || null;
  const refParam =
    url.searchParams.get("reference") || url.searchParams.get("order") || null;

  let orderId = refParam || "";

  // Resolve orderId from the initiated metric (providerRef stored in order_code).
  if (!orderId && linkId) {
    const ev = await prisma.paymentEvent.findFirst({
      where: { provider: "globalpayments", orderCode: linkId },
      orderBy: { createdAt: "desc" },
      select: { orderId: true },
    });
    orderId = ev?.orderId ?? "";
  }

  if (orderId) {
    await recordMetric({
      provider: "globalpayments",
      orderId,
      status: "success",
      orderCode: linkId,
    });
  }
  log.info("gp.success_redirect", { orderId, linkId });

  const target = `${env.SHOP_DOMAIN}/payment/success?order=${encodeURIComponent(
    orderId
  )}`;
  return NextResponse.redirect(target, 302);
}
