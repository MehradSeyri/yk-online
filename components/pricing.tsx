"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
    nameCs: "Šablony",
    nameEn: "Templates",
    amountCs: "499 Kč",
    amountEn: "€19",
    descCs: "Šablony pro sociální sítě",
    descEn: "Social Media Templates Pack",
    features: [
      { cs: "120+ šablon pro Instagram, Facebook a LinkedIn", en: "120+ templates for Instagram, Facebook and LinkedIn" },
      { cs: "Editovatelné v Canva, Figma a PowerPoint", en: "Editable in Canva, Figma and PowerPoint" },
      { cs: "Dostupné okamžitě po zaplacení", en: "Available immediately after payment" },
      { cs: "Lifetime přístup + aktualizace zdarma", en: "Lifetime access + free updates" },
    ],
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Checklist",
    nameEn: "Checklist",
    amountCs: "749 Kč",
    amountEn: "€29",
    descCs: "SEO Audit — komplexní šablona",
    descEn: "SEO Audit — Complete Template",
    features: [
      { cs: "150-bodový SEO checklist", en: "150-point SEO checklist" },
      { cs: "Šablona pro klientské reporty", en: "Client report template" },
      { cs: "Průvodce Google Search Console", en: "Google Search Console guide" },
      { cs: "Dostupné okamžitě po zaplacení", en: "Available immediately after payment" },
    ],
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Online program",
    nameEn: "Online program",
    amountCs: "2 249 Kč",
    amountEn: "€89",
    descCs: "Program: Digitální marketing",
    descEn: "Program: Digital Marketing",
    features: [
      { cs: "8 hodin videolekcí (CZ + EN titulky)", en: "8 hours of video lessons (CZ + EN subtitles)" },
      { cs: "Šablony a pracovní listy ke stažení", en: "Downloadable templates and worksheets" },
      { cs: "Live Q&A sezení 1× měsíčně", en: "Live Q&A session once a month" },
      { cs: "Certifikát po absolvování", en: "Certificate upon completion" },
      { cs: "Přístup po dobu 12 měsíců", en: "Access for 12 months" },
    ],
    featured: true,
    badgeCs: "Nejprodávanější",
    badgeEn: "Best seller",
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Šablona",
    nameEn: "Template",
    amountCs: "599 Kč",
    amountEn: "€24",
    descCs: "Marketingový plán — šablona",
    descEn: "Marketing Plan Template",
    features: [
      { cs: "Roční marketingový plán (Notion + Google Docs)", en: "Annual marketing plan (Notion + Google Docs)" },
      { cs: "KPI dashboard a trackery výkonu", en: "KPI dashboard and performance trackers" },
      { cs: "Obsahový kalendář na 12 měsíců", en: "12-month content calendar" },
      { cs: "Dostupné okamžitě po zaplacení", en: "Available immediately after payment" },
    ],
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Online program",
    nameEn: "Online program",
    amountCs: "1 749 Kč",
    amountEn: "€69",
    perCs: "2 499 Kč",
    perEn: "€99",
    perStrike: true,
    descCs: "Program: Social Media Mastery",
    descEn: "Program: Social Media Mastery",
    features: [
      { cs: "6 hodin videolekcí", en: "6 hours of video lessons" },
      { cs: "Strategie pro IG, FB, TikTok, YT a LinkedIn", en: "Strategy for IG, FB, TikTok, YT and LinkedIn" },
      { cs: "Šablony obsahového plánu", en: "Content plan templates" },
      { cs: "30denní obsahový plán zdarma", en: "30-day content plan included free" },
    ],
    badgeCs: "Sleva −30 %",
    badgeEn: "Sale −30 %",
    badgeSale: true,
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Design kit",
    nameEn: "Design kit",
    amountCs: "1 099 Kč",
    amountEn: "€44",
    descCs: "Brand Identity Kit",
    descEn: "Brand Identity Kit",
    features: [
      { cs: "60+ šablon pro vizuální identitu", en: "60+ visual identity templates" },
      { cs: "Šablona brand style guide", en: "Brand style guide template" },
      { cs: "Editovatelné v Adobe, Canva a Figma", en: "Editable in Adobe, Canva and Figma" },
      { cs: "Dostupné okamžitě po zaplacení", en: "Available immediately after payment" },
    ],
    btnCs: "Koupit nyní",
    btnEn: "Buy now",
  },
  {
    nameCs: "Konzultace",
    nameEn: "Consulting",
    amountCs: "1 500 Kč",
    amountEn: "€59",
    perCs: "/ hod",
    perEn: "/ hr",
    descCs: "Hodinová sazba — komplexní služby",
    descEn: "Hourly rate — full-service consulting",
    features: [
      { cs: "Digitální marketing & SEO", en: "Digital marketing & SEO" },
      { cs: "Brandová strategie & positioning", en: "Brand strategy & positioning" },
      { cs: "Tvorba obsahu & copywriting", en: "Content creation & copywriting" },
      { cs: "Online business & growth hacking", en: "Online business & growth hacking" },
    ],
    btnCs: "Mám zájem",
    btnEn: "I'm interested",
  },
  {
    nameCs: "Custom projekt",
    nameEn: "Custom project",
    amountCs: "Individuální",
    amountEn: "On request",
    descCs: "Řešení šité přesně na vaše potřeby",
    descEn: "Solution tailored exactly to your needs",
    features: [
      { cs: "Komplexní strategie od A do Z", en: "Full strategy from A to Z" },
      { cs: "Dedikovaný tým specialistů", en: "Dedicated team of specialists" },
      { cs: "Pravidelný reporting & analytika", en: "Regular reporting & analytics" },
      { cs: "Prioritní podpora 24/7", en: "Priority support 24/7" },
      { cs: "Cena dle rozsahu projektu", en: "Price based on project scope" },
    ],
    featured: true,
    badgeCs: "Na míru",
    badgeEn: "Custom",
    btnCs: "Nezávazná poptávka",
    btnEn: "Get a free quote",
  },
];

function slidesPerView(width: number): number {
  if (width <= 720) return 1;
  if (width <= 960) return 2;
  return 3;
}

export function Pricing() {
  const { lang, onPricingClick } = useSite();
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const drag = useRef<{ active: boolean; pointerId: number | null; startX: number }>(
    { active: false, pointerId: null, startX: 0 }
  );

  const update = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const perView = slidesPerView(window.innerWidth);
    const pages = Math.max(1, Math.ceil(PRODUCTS.length / perView));
    setPageCount(pages);
    setIndex((prev) => {
      let i = prev;
      if (i >= pages) i = pages - 1;
      if (i < 0) i = 0;
      const pageWidth = viewport.clientWidth;
      const maxShift = Math.max(0, track.scrollWidth - pageWidth);
      const shiftPx = Math.min(i * pageWidth, maxShift);
      track.style.transform = `translateX(-${shiftPx}px)`;
      return i;
    });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  // Re-apply transform whenever index changes.
  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const pageWidth = viewport.clientWidth;
    const maxShift = Math.max(0, track.scrollWidth - pageWidth);
    const shiftPx = Math.min(index * pageWidth, maxShift);
    track.style.transform = `translateX(-${shiftPx}px)`;
  }, [index]);

  const go = (delta: number) =>
    setIndex((i) => Math.min(Math.max(i + delta, 0), pageCount - 1));

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, label, select")) {
      drag.current = { active: false, pointerId: null, startX: 0 };
      return;
    }
    if (e.button !== 0) return;
    drag.current = { active: true, pointerId: e.pointerId, startX: e.clientX };
    viewportRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || drag.current.pointerId !== e.pointerId) return;
    const diff = e.clientX - drag.current.startX;
    if (Math.abs(diff) > 40) go(diff < 0 ? 1 : -1);
    drag.current = { active: false, pointerId: null, startX: 0 };
  };

  const onPointerCancel = () => {
    drag.current = { active: false, pointerId: null, startX: 0 };
  };

  return (
    <section className="pricing section" id="products">
      <div className="container">
        <div className="section-header">
          <T as="span" className="section-badge" cs="Katalog produktů" en="Product catalog" />
          <T as="h2" cs="Digitální produkty & služby" en="Digital products & services" />
          <T
            as="p"
            cs="Přihlaste se nebo se zaregistrujte pro přístup k nákupu."
            en="Log in or sign up to start shopping."
          />
        </div>
        <div className="pricing-carousel">
          <button
            className="pricing-nav pricing-nav--prev"
            aria-label="Previous"
            disabled={index === 0}
            onClick={() => go(-1)}
          >
            ❮
          </button>
          <div className="pricing-viewport" ref={viewportRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            <div className="pricing__grid" ref={trackRef}>
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
                        lang === "cs" ? p.descCs : p.descEn,
                        lang === "cs" ? p.amountCs : p.amountEn
                      )
                    }
                  >
                    {lang === "cs" ? p.btnCs : p.btnEn}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button
            className="pricing-nav pricing-nav--next"
            aria-label="Next"
            disabled={index === pageCount - 1}
            onClick={() => go(1)}
          >
            ❯
          </button>
        </div>
        <div className="pricing-dots" aria-label="Pricing pagination">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`pricing-dot${i === index ? " active" : ""}`}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <T
          as="p"
          className="pricing__note"
          cs="* Pro dokončení objednávky je nutná registrace a přihlášení. Digitální produkty jsou dostupné okamžitě po dokončení platby. Ceny jsou uvedeny v Kč. Nejsme plátci DPH."
          en="* Registration and login required to complete an order. Digital products are available immediately after payment. Prices are in EUR. We are not VAT payers."
        />
      </div>
    </section>
  );
}
