"use client";

import Link from "next/link";
import { useSite } from "./site-context";
import { T } from "./t";

export function LegalShell({
  titleCs,
  titleEn,
  updatedCs,
  updatedEn,
  contentCs,
  contentEn,
}: {
  titleCs: string;
  titleEn: string;
  updatedCs: string;
  updatedEn: string;
  contentCs: string;
  contentEn: string;
}) {
  const { lang } = useSite();
  return (
    <main className="legal-page">
      <div className="container">
        <Link href="/" className="legal-back">
          ←{" "}
          <T cs="Zpět na hlavní stránku" en="Back to homepage" />
        </Link>

        <div className="legal-header">
          <T as="h1" cs={titleCs} en={titleEn} />
          <T as="p" className="legal-updated" cs={updatedCs} en={updatedEn} />
        </div>

        <div
          className="legal-content"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: lang === "cs" ? contentCs : contentEn,
          }}
        />
      </div>
    </main>
  );
}
