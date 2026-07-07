/**
 * Coupon/discount code registry.
 *
 * Configure via COUPON_CODES env var (comma-separated CODE:PERCENT pairs):
 *   COUPON_CODES=TEST99:99,SUMMER20:20,B2BDEAL:15
 *
 * Codes are case-insensitive. Percentages are integers 1-100.
 */
export function getCoupons(): Record<string, number> {
  const raw = process.env.COUPON_CODES ?? "";
  if (!raw.trim()) return {};
  const result: Record<string, number> = {};
  for (const entry of raw.split(",")) {
    const parts = entry.trim().split(":");
    if (parts.length !== 2) continue;
    const [code, pctStr] = parts;
    if (!code || !pctStr) continue;
    const pct = parseInt(pctStr, 10);
    if (isNaN(pct) || pct < 1 || pct > 100) continue;
    result[code.trim().toUpperCase()] = pct;
  }
  return result;
}

/** Returns discount percentage (1-100) or null if the code is invalid. */
export function validateCoupon(code: string): number | null {
  if (!code.trim()) return null;
  const pct = getCoupons()[code.trim().toUpperCase()];
  return pct !== undefined ? pct : null;
}

/** Apply discount to an amount. Returns discounted amount rounded to 2 decimal places. */
export function applyDiscount(amount: number, discountPct: number): number {
  const discounted = amount * (1 - discountPct / 100);
  return Math.round(discounted * 100) / 100;
}
