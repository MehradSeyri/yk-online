"use client";

import { useState } from "react";
import { useSite } from "./site-context";
import { T } from "./t";

interface Product {
  nameCs: string;
  nameEn: string;
  amountCs: string;
  amountEn: string;
  perCs?: string;
  perEn?: string;
  perStrike?: boolean;
  descCs: string;
  descEn: string;
  features: { cs: string; en: string }[];
  featured?: boolean;
  badgeCs?: string;
  badgeEn?: string;
  badgeSale?: boolean;
  btnCs: string;
  btnEn: string;
}

const PRODUCTS: Product[] = [
  {
    nameCs: "B2B Content Suite",
    nameEn: "B2B Content Suite",
    amountCs: "2 490 Kč",
    amountEn: "€99",
    descCs: "Šablony a postupy pro firemní marketingové týmy",
    descEn: "Templates and workflows for corporate marketing teams",
    features: [
      { cs: "80+ B2B šablon", en: "80+ B2B templates" },
      { cs: "PowerPoint, Figma, Canva", en: "PowerPoint, Figma, Canva" },
      { cs: "Okamžitý přístup", en: "Instant access" },
      { cs: "Čtvrtletní aktualizace", en: "Quarterly updates" },
    ],
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Enterprise SEO Pack",
    nameEn: "Enterprise SEO Pack",
    amountCs: "3 490 Kč",
    amountEn: "€139",
    descCs: "Auditní balík pro interní týmy a agentury",
    descEn: "Audit toolkit for in-house teams and agencies",
    features: [
      { cs: "200-bodový SEO framework", en: "200-point SEO framework" },
      { cs: "Reporting pro management", en: "Management reporting pack" },
      { cs: "Release checklist", en: "Release checklist" },
      { cs: "Auditní workbook", en: "Audit workbook" },
    ],
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Leadership Academy",
    nameEn: "Leadership Academy",
    amountCs: "4 990 Kč",
    amountEn: "€199",
    descCs: "Video program pro vedoucí marketingových týmů",
    descEn: "Video program for marketing team leaders",
    features: [
      { cs: "12 video modulů", en: "12 video modules" },
      { cs: "Schvalovací frameworky", en: "Approval frameworks" },
      { cs: "KPI dashboard šablony", en: "KPI dashboard templates" },
      { cs: "Roční přístup", en: "Annual access" },
    ],
    featured: true,
    badgeCs: "Pro firmy",
    badgeEn: "For companies",
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Brand Governance Kit",
    nameEn: "Brand Governance Kit",
    amountCs: "2 990 Kč",
    amountEn: "€119",
    descCs: "Interní standardy značky a komunikace",
    descEn: "Internal brand and communication standards",
    features: [
      { cs: "Brand playbook", en: "Brand playbook" },
      { cs: "E-mail + prezentace šablony", en: "Email + presentation templates" },
      { cs: "Schvalovací checklist", en: "Approval checklist" },
      { cs: "Praktické příklady", en: "Usage examples" },
    ],
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Annual Team Library",
    nameEn: "Annual Team Library",
    amountCs: "6 990 Kč",
    amountEn: "€279",
    descCs: "Kompletní firemní knihovna šablon a kurzů",
    descEn: "Complete enterprise library of templates and courses",
    features: [
      { cs: "Přístup pro 10 uživatelů", en: "Access for 10 users" },
      { cs: "Měsíční nové balíčky", en: "Monthly new packs" },
      { cs: "Reporting + campaign šablony", en: "Reporting + campaign templates" },
      { cs: "Priority e-mail podpora", en: "Priority e-mail support" },
    ],
    badgeCs: "Nejlepší hodnota",
    badgeEn: "Best value",
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
];

function parseCatalogPrice(text: string): { amount: number; currency: "CZK" | "EUR" } {
  const currency = text.includes("€") || text.includes("â‚¬") || text.includes("EUR") ? "EUR" : "CZK";
  const amount = Number(text.replace(/[^0-9]/g, "")) || 0;
  return { amount, currency };
}

export function Pricing() {
  const { lang, onPricingClick, showToast } = useSite();
  const [payingIndex, setPayingIndex] = useState<number | null>(null);

  const startOnlinePayment = async (product: Product, index: number) => {
    if (payingIndex !== null) return;

    const productName = lang === "cs" ? product.nameCs : product.nameEn;
    const price = lang === "cs" ? product.amountCs : product.amountEn;
    const parsed = parseCatalogPrice(price);

    if (!parsed.amount) {
      showToast(
        lang === "cs"
          ? "Tento produkt nema pevnou cenu pro online platbu."
          : "This product does not have a fixed price for online payment."
      );
      return;
    }

    setPayingIndex(index);
    try {
      const res = await fetch("/api/public-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productName,
          amount: parsed.amount,
          currency: parsed.currency,
          lang,
        }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "missing checkoutUrl");
      }
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      showToast(
        lang === "cs"
          ? `Online platbu se nepodarilo zalozit. ${err instanceof Error ? err.message : ""}`
          : `Online payment could not be initialized. ${err instanceof Error ? err.message : ""}`,
        5000
      );
      setPayingIndex(null);
    }
  };

  return (
    <section className="pricing section" id="products">
      <div className="container">
        <div className="section-header">
          <T as="span" className="section-badge" cs="Katalog produktů" en="Product catalog" />
          <T as="h2" cs="Řešení pro firemní týmy" en="Solutions for corporate teams" />
          <T
            as="p"
            cs="Produktizované balíčky pro marketingová oddělení, interní týmy a agenturní provoz."
            en="Productized packages for marketing departments, in-house teams and agency operations."
          />
        </div>
        <div className="pricing__grid">
          {PRODUCTS.map((p, i) => (
            <div
              key={i}
              className={`pricing-card${p.featured ? " pricing-card--featured" : ""}`}
              style={p.badgeSale ? { position: "relative" } : undefined}
            >
              {p.badgeCs && (
                <div
                  className="pricing-card__badge"
                  style={
                    p.badgeSale
                      ? { background: "linear-gradient(90deg,#ef4444,#f97316)" }
                      : undefined
                  }
                >
                  {lang === "cs" ? p.badgeCs : p.badgeEn}
                </div>
              )}
              <div className="pricing-card__header">
                <span className="pricing-card__name">
                  {lang === "cs" ? p.nameCs : p.nameEn}
                </span>
                <div className="pricing-card__price">
                  <span className="amount">
                    {lang === "cs" ? p.amountCs : p.amountEn}
                  </span>
                  {p.perCs && (
                    <span
                      className="per"
                      style={
                        p.perStrike
                          ? { textDecoration: "line-through", opacity: 0.55 }
                          : undefined
                      }
                    >
                      {lang === "cs" ? p.perCs : p.perEn}
                    </span>
                  )}
                </div>
                <p className="pricing-card__desc">
                  {lang === "cs" ? p.descCs : p.descEn}
                </p>
              </div>
              <ul className="pricing-card__features">
                {p.features.map((f, fi) => (
                  <li key={fi}>{lang === "cs" ? f.cs : f.en}</li>
                ))}
              </ul>
              <button
                className="btn btn--primary btn--full pricing-btn"
                onClick={() =>
                  onPricingClick(
                    lang === "cs" ? p.nameCs : p.nameEn,
                    lang === "cs" ? p.amountCs : p.amountEn
                  )
                }
              >
                {lang === "cs" ? p.btnCs : p.btnEn}
              </button>
              <button
                type="button"
                className="btn btn--outline btn--full pricing-btn"
                disabled={payingIndex !== null}
                onClick={() => startOnlinePayment(p, i)}
              >
                {payingIndex === i
                  ? lang === "cs"
                    ? "Pripravuji online platbu..."
                    : "Preparing online payment..."
                  : lang === "cs"
                    ? "Online platba kartou"
                    : "Pay online by card"}
              </button>
            </div>
          ))}
        </div>
        <T
          as="p"
          className="pricing__note"
          cs="* Digitální produkty jsou dostupné okamžitě po dokončení platby. Ceny jsou uvedeny v Kč. Nejsme plátci DPH. Pro firemní nákupy vystavujeme standardní daňový doklad."
          en="* Digital products are available immediately after payment. Prices are in EUR. We are not VAT payers. Standard business invoice is issued for corporate purchases."
        />
      </div>
    </section>
  );
}
