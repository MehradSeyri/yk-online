/**
 * Server-side language normalization. AAA.CZ passes a loose lang hint;
 * we map it to provider-accepted locale codes. Fallback: en-GB.
 */

const LOCALE_MAP: Record<string, string> = {
  cs: "cs-CZ",
  "cs-cz": "cs-CZ",
  cz: "cs-CZ",
  sk: "sk-SK",
  "sk-sk": "sk-SK",
  en: "en-GB",
  "en-gb": "en-GB",
  "en-us": "en-GB",
  de: "de-DE",
  "de-de": "de-DE",
  pl: "pl-PL",
  "pl-pl": "pl-PL",
  hu: "hu-HU",
  "hu-hu": "hu-HU",
  ro: "ro-RO",
  "ro-ro": "ro-RO",
  el: "el-GR",
  "el-gr": "el-GR",
};

export const DEFAULT_LOCALE = "en-GB";

/** Normalize an arbitrary lang hint to a provider locale (e.g. `cs` -> `cs-CZ`). */
export function normalizeLang(input?: string | null): string {
  if (!input) return DEFAULT_LOCALE;
  const key = input.trim().toLowerCase();
  return LOCALE_MAP[key] ?? DEFAULT_LOCALE;
}
