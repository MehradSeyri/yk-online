"use client";

import Link from "next/link";
import { T } from "./t";

// Decorative dashboard illustration. Kept as raw SVG markup (aria-hidden) so the
// original attribute syntax is preserved verbatim.
const HERO_SVG = `
<svg class="hero__svg" viewBox="0 0 540 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hBg1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity=".45"/>
    </linearGradient>
    <linearGradient id="hBg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c4b5fd"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity=".45"/>
    </linearGradient>
    <linearGradient id="hArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity=".3"/>
      <stop offset="100%" stop-color="#60a5fa" stop-opacity="0"/>
    </linearGradient>
    <filter id="hShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity=".18"/>
    </filter>
  </defs>
  <circle cx="490" cy="55" r="90" fill="#7c3aed" fill-opacity=".07"/>
  <circle cx="50" cy="360" r="75" fill="#3b82f6" fill-opacity=".06"/>
  <rect x="70" y="30" width="370" height="268" rx="18" fill="white" fill-opacity=".08" stroke="white" stroke-opacity=".18" stroke-width="1.5" filter="url(#hShadow)"/>
  <rect x="70" y="30" width="370" height="46" rx="18" fill="white" fill-opacity=".06"/>
  <rect x="70" y="62" width="370" height="1" fill="white" fill-opacity=".12"/>
  <circle cx="97" cy="53" r="5.5" fill="#ef4444" fill-opacity=".85"/>
  <circle cx="115" cy="53" r="5.5" fill="#f59e0b" fill-opacity=".85"/>
  <circle cx="133" cy="53" r="5.5" fill="#22c55e" fill-opacity=".85"/>
  <rect x="155" y="47" width="90" height="10" rx="5" fill="white" fill-opacity=".28"/>
  <line x1="90" y1="110" x2="420" y2="110" stroke="white" stroke-opacity=".05" stroke-width="1"/>
  <line x1="90" y1="155" x2="420" y2="155" stroke="white" stroke-opacity=".05" stroke-width="1"/>
  <line x1="90" y1="200" x2="420" y2="200" stroke="white" stroke-opacity=".05" stroke-width="1"/>
  <line x1="90" y1="245" x2="420" y2="245" stroke="white" stroke-opacity=".05" stroke-width="1"/>
  <rect x="100" y="228" width="28" height="50" rx="5" fill="url(#hBg1)"/>
  <rect x="146" y="208" width="28" height="70" rx="5" fill="url(#hBg1)"/>
  <rect x="192" y="183" width="28" height="95" rx="5" fill="url(#hBg1)"/>
  <rect x="238" y="198" width="28" height="80" rx="5" fill="url(#hBg2)"/>
  <rect x="284" y="163" width="28" height="115" rx="5" fill="url(#hBg2)"/>
  <rect x="330" y="173" width="28" height="105" rx="5" fill="url(#hBg2)"/>
  <rect x="376" y="133" width="28" height="145" rx="5" fill="url(#hBg2)"/>
  <path d="M114 222 C138 210 160 198 206 178 C230 168 252 185 266 182 C290 178 308 163 322 158 C348 152 366 162 390 148 L390 278 L114 278 Z" fill="url(#hArea)"/>
  <path d="M114 222 C138 210 160 198 206 178 C230 168 252 185 266 182 C290 178 308 163 322 158 C348 152 366 162 390 148" stroke="#60a5fa" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="114" cy="222" r="3.5" fill="#60a5fa"/>
  <circle cx="206" cy="178" r="3.5" fill="#60a5fa"/>
  <circle cx="266" cy="182" r="3.5" fill="#60a5fa"/>
  <circle cx="322" cy="158" r="3.5" fill="#60a5fa"/>
  <circle cx="390" cy="148" r="7" fill="white" fill-opacity=".15" stroke="#60a5fa" stroke-width="2"/>
  <circle cx="390" cy="148" r="3.5" fill="white"/>
  <g class="hfc hfc--1" filter="url(#hShadow)">
    <rect x="393" y="14" width="140" height="70" rx="13" fill="white" fill-opacity=".12" stroke="white" stroke-opacity=".22" stroke-width="1"/>
    <rect x="406" y="26" width="32" height="32" rx="8" fill="#22c55e" fill-opacity=".28"/>
    <polyline points="422,50 422,36 416,42" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="422,36 428,42" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="447" y="37" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="white" fill-opacity=".55" letter-spacing=".5">GROWTH</text>
    <text x="447" y="55" font-family="Inter,sans-serif" font-size="19" font-weight="800" fill="white" fill-opacity=".92">+42%</text>
  </g>
  <g class="hfc hfc--2" filter="url(#hShadow)">
    <rect x="0" y="205" width="126" height="68" rx="13" fill="white" fill-opacity=".12" stroke="white" stroke-opacity=".22" stroke-width="1"/>
    <rect x="12" y="217" width="32" height="32" rx="8" fill="#3b82f6" fill-opacity=".3"/>
    <circle cx="28" cy="225" r="6" fill="none" stroke="#93c5fd" stroke-width="1.8"/>
    <path d="M18 241 Q28 237 38 241" stroke="#93c5fd" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <text x="52" y="227" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="white" fill-opacity=".55" letter-spacing=".5">ORDERS</text>
    <text x="52" y="248" font-family="Inter,sans-serif" font-size="19" font-weight="800" fill="white" fill-opacity=".92">127</text>
  </g>
  <g class="hfc hfc--3" filter="url(#hShadow)">
    <rect x="398" y="308" width="136" height="68" rx="13" fill="white" fill-opacity=".12" stroke="white" stroke-opacity=".22" stroke-width="1"/>
    <circle cx="418" cy="342" r="12" fill="#7c3aed" fill-opacity=".2"/>
    <circle cx="418" cy="342" r="6" fill="#a78bfa" class="hpulse"/>
    <text x="438" y="332" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="white" fill-opacity=".55" letter-spacing=".5">REVENUE</text>
    <text x="438" y="348" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="white" fill-opacity=".9">&#x25CF; LIVE</text>
    <text x="438" y="364" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="#4ade80">$12,840</text>
  </g>
  <circle cx="35" cy="90" r="2.5" fill="white" fill-opacity=".18"/>
  <circle cx="50" cy="90" r="2.5" fill="white" fill-opacity=".18"/>
  <circle cx="65" cy="90" r="2.5" fill="white" fill-opacity=".18"/>
  <circle cx="35" cy="106" r="2.5" fill="white" fill-opacity=".18"/>
  <circle cx="50" cy="106" r="2.5" fill="white" fill-opacity=".18"/>
  <circle cx="65" cy="106" r="2.5" fill="white" fill-opacity=".18"/>
  <circle cx="35" cy="122" r="2.5" fill="white" fill-opacity=".18"/>
  <circle cx="50" cy="122" r="2.5" fill="white" fill-opacity=".18"/>
  <circle cx="65" cy="122" r="2.5" fill="white" fill-opacity=".18"/>
</svg>`;

export function Hero() {
  const onCta = () => {
    document
      .querySelector("#products")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
          <T
            as="div"
            className="hero__badge"
            cs="B2B Marketing Enablement"
            en="B2B Marketing Enablement"
          />
          <T
            as="h1"
            className="hero__title"
            html
            cs="Produktizované balíčky<br>pro firemní týmy."
            en="Productized packages<br>for corporate teams."
          />
          <T
            as="p"
            className="hero__sub"
            cs="Standardizované šablony, workflow a vzdělávací obsah pro interní marketing, reporting a kampaně. Rychlé nasazení bez složitých implementací."
            en="Standardized templates, workflows and learning content for in-house marketing, reporting and campaigns. Fast deployment without complex implementation."
          />
          <div className="hero__cta">
            <button className="btn btn--primary btn--lg" onClick={onCta}>
              <T cs="Prohlédnout katalog" en="Browse catalog" />
            </button>
            <Link href="/#categories" className="btn btn--ghost btn--lg">
              <T cs="Co nabízíme" en="What we offer" />
            </Link>
          </div>
        </div>

        <div
          className="hero__visual"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: HERO_SVG }}
        />
      </div>
      <div className="hero__bg-shape"></div>
    </section>
  );
}
