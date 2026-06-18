import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness probe. Does not validate env (kept dependency-free).
export async function GET() {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
