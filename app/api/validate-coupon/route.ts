import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const discount = validateCoupon(code);
  if (discount === null) {
    return NextResponse.json({ valid: false });
  }
  return NextResponse.json({ valid: true, discount });
}
