"use client";

import { createElement } from "react";
import { useSite } from "./site-context";

type TProps = {
  cs: string;
  en: string;
  /** HTML tag to render. Default: span. */
  as?: keyof JSX.IntrinsicElements;
  /** Render inner string as HTML (the originals embed <br>, <strong>, links). */
  html?: boolean;
} & Record<string, unknown>;

/**
 * Bilingual text node. Mirrors the original `data-cs` / `data-en` pattern:
 * picks the string for the active language. Many originals contain markup
 * (<br>, <strong>, buttons) so `html` renders via dangerouslySetInnerHTML.
 */
export function T({ cs, en, as = "span", html = false, ...rest }: TProps) {
  const { lang } = useSite();
  const value = lang === "cs" ? cs : en;

  if (html) {
    return createElement(as, {
      ...rest,
      suppressHydrationWarning: true,
      dangerouslySetInnerHTML: { __html: value },
    });
  }
  return createElement(
    as,
    { ...rest, suppressHydrationWarning: true },
    value
  );
}

/** Hook variant for places that need the raw string (placeholders, aria). */
export function useT() {
  const { lang } = useSite();
  return (cs: string, en: string) => (lang === "cs" ? cs : en);
}
