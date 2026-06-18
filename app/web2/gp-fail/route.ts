import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { recordMetric } from "@/lib/webhook-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GlobalPayments cancel/fail return URL. UX + metric only. Always 302 to AAA.CZ.
 */
export async function GET(req: NextRequest) {
  const env = getEnv();
  const url = new URL(req.url);
  const linkId =
    url.searchParams.get("id") || url.searchParams.get("link_id") || null;
  const refParam =
    url.searchParams.get("reference") || url.searchParams.get("order") || null;
  const eventId = url.searchParams.get("event") || null;

  let orderId = refParam || "";
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
      status: "failed",
      orderCode: linkId,
      eventId,
    });
  }
  log.info("gp.fail_redirect", { orderId, linkId, eventId });

  const target =
    `${env.SHOP_DOMAIN}/payment/failed?order=${encodeURIComponent(orderId)}` +
    (eventId ? `&event=${encodeURIComponent(eventId)}` : "");
  return NextResponse.redirect(target, 302);
}
