/**
 * Small currency helper utilities shared by providers.
 */

const ALPHA_TO_NUMERIC: Record<string, number> = {
  EUR: 978,
  CZK: 203,
  USD: 840,
  GBP: 826,
  PLN: 985,
  HUF: 348,
  RON: 946,
  BGN: 975,
};

const NUMERIC_TO_ALPHA: Record<number, string> = Object.fromEntries(
  Object.entries(ALPHA_TO_NUMERIC).map(([k, v]) => [v, k])
) as Record<number, string>;

export function alphaToNumeric(currency: string): number | undefined {
  if (!currency) return undefined;
  return ALPHA_TO_NUMERIC[currency.toUpperCase()];
}

export function numericToAlpha(code?: number | string): string | undefined {
  if (code === undefined || code === null) return undefined;
  const n = typeof code === "string" ? Number(code) : code;
  if (!Number.isFinite(n)) return undefined;
  return NUMERIC_TO_ALPHA[n];
}

export const ALLOWED_NUMERIC_CURRENCIES = new Set<number>([
  978, // EUR
  203, // CZK
  840, // USD
  985, // PLN
  946, // RON
]);
