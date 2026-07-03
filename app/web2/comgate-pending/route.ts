import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const env = getEnv();
  const url = new URL(req.url);
  const refId = url.searchParams.get("refId") || "";
  const transId = url.searchParams.get("transId") || url.searchParams.get("id") || "";

  log.info("comgate.pending_redirect", { orderId: refId, transId });
  const target = `${env.SHOP_DOMAIN}/payment/pending?order=${encodeURIComponent(refId)}`;
  return NextResponse.redirect(target, 302);
}
