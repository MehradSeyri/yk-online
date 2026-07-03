"use client";

import Link from "next/link";
import { T } from "./t";

export function Services() {
  return (
    <section className="services section" id="categories">
      <div className="container">
        <div className="section-header">
          <T as="span" className="section-badge" cs="Co nabízíme" en="What we offer" />
          <T as="h2" cs="Digitální produkty a vzdělávací obsah" en="Digital products and learning content" />
          <T
            as="p"
            cs="B2B balíčky připravené pro interní týmy, agenturní provoz a firemní reporting."
            en="B2B packages designed for in-house teams, agency operations and corporate reporting."
          />
        </div>
        <div className="services__grid">
          <div className="card">
            <div className="card__icon">📄</div>
            <T as="h3" cs="Digitální šablony" en="Digital Templates" />
            <T
              as="p"
              cs="Firemní šablony pro kampaně, prezentace, newslettery a sales materiály s jednotným standardem."
              en="Corporate templates for campaigns, presentations, newsletters and sales assets with consistent standards."
            />
          </div>
          <div className="card">
            <div className="card__icon">🎓</div>
            <T as="h3" cs="Online kurzy" en="Online Courses" />
            <T
              as="p"
              cs="Strukturované video moduly pro team leady a specialisty: plánování, výkon, governance a reporting."
              en="Structured video modules for team leads and specialists: planning, performance, governance and reporting."
            />
          </div>
          <div className="card">
            <div className="card__icon">📈</div>
            <T as="h3" cs="Pracovní postupy" en="Workflows" />
            <T
              as="p"
              cs="Workflow šablony pro schvalování, obsahové procesy a řízení kampaní napříč odděleními."
              en="Workflow templates for approvals, content operations and campaign management across teams."
            />
          </div>
          <div className="card">
            <div className="card__icon">🔧</div>
            <T as="h3" cs="Nástroje & checklists" en="Tools & Checklists" />
            <T
              as="p"
              cs="Auditní checklisty, kontrolní listy releasů a frameworky pro stabilní provoz marketingových aktivit."
              en="Audit checklists, release control lists and frameworks for stable marketing operations."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhyUs() {
  return (
    <section className="whyus section">
      <div className="container">
        <div className="section-header">
          <T as="span" className="section-badge" cs="Proč nakupovat u nás" en="Why buy from us" />
          <T as="h2" cs="Nakupujte s jistotou" en="Shop with confidence" />
        </div>
        <div className="whyus__grid">
          <div className="whyus__item">
            <div className="whyus__icon">⚡</div>
            <div>
              <T as="h4" cs="Okamžitý přístup" en="Instant access" />
              <T
                as="p"
                cs="Po úhradě získáte ihned přístup k zakoupeným materiálům bez čekání na manuální zpracování."
                en="After payment, access to purchased materials is immediate with no manual processing delay."
              />
            </div>
          </div>
          <div className="whyus__item">
            <div className="whyus__icon">🔒</div>
            <div>
              <T as="h4" cs="Bezpečná úhrada" en="Secure payment" />
              <T
                as="p"
                cs="Šifrované online platby a transparentní platební instrukce pro firemní objednávky."
                en="Encrypted online payments and transparent payment instructions for business orders."
              />
            </div>
          </div>
          <div className="whyus__item">
            <div className="whyus__icon">🔄</div>
            <div>
              <T as="h4" cs="Transparentní podmínky" en="Transparent terms" />
              <T
                as="p"
                cs="Jasně definované obchodní podmínky, reklamační proces a podpora dostupná na jednom místě."
                en="Clearly defined terms, complaint process and support details available in one place."
              />
            </div>
          </div>
          <div className="whyus__item">
            <div className="whyus__icon">✓</div>
            <div>
              <T as="h4" cs="Připraveno pro B2B použití" en="Built for B2B use" />
              <T
                as="p"
                cs="Obsah je strukturovaný pro interní týmy a rychlé nasazení v menších i větších firmách."
                en="Content is structured for in-house teams and fast deployment in small and large companies."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShopCompliance() {
  return (
    <section className="compliance section" id="shop-info">
      <div className="container">
        <div className="section-header">
          <T as="span" className="section-badge" cs="Informace pro zákazníky" en="Customer information" />
          <T as="h2" cs="Náležitosti e-shopu" en="E-shop legal essentials" />
          <T
            as="p"
            cs="Všechny povinné údaje, podmínky nákupu a právní dokumenty na jednom místě."
            en="All required details, purchase terms and legal documents in one place."
          />
        </div>

        <div className="compliance__grid">
          <div className="compliance-card">
            <T as="h3" cs="Provozovatel a kontakt" en="Merchant and contact" />
            <ul className="compliance-list">
              <li>
                <T cs="YK Online, s.r.o., Radimovická 1773/15, Chodov, 149 00 Praha" en="YK Online, s.r.o., Radimovicka 1773/15, Chodov, 149 00 Prague" />
              </li>
              <li>
                <T cs="IČO: 24062421" en="Company ID: 24062421" />
              </li>
              <li>
                <a href="mailto:info@yk-online.eu">info@yk-online.eu</a>
              </li>
              <li>
                <a href="tel:+420775170443">+420 775 170 443</a>
              </li>
              <li>
                <Link href="/contact">
                  <T cs="Kompletní kontaktní stránka" en="Full contact page" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="compliance-card">
            <T as="h3" cs="Objednávka, dodání a platba" en="Ordering, delivery and payment" />
            <ul className="compliance-list">
              <li>
                <T cs="Popis a cena každého produktu jsou uvedeny v katalogu výše." en="Product description and price are shown in the catalog above." />
              </li>
              <li>
                <T cs="Objednávku provedete tlačítkem Koupit nyní u konkrétní položky." en="You can place an order using the Buy now button on each item." />
              </li>
              <li>
                <T cs="Digitální produkty doručujeme elektronicky, zpravidla ihned po úspěšné úhradě." en="Digital products are delivered electronically, typically immediately after successful payment." />
              </li>
              <li>
                <T cs="Online platby kartou jsou zajištěny přes zabezpečenou platební bránu." en="Online card payments are processed via a secure payment gateway." />
              </li>
              <li>
                <T cs="Web používá zabezpečené připojení HTTPS." en="The website uses secure HTTPS connection." />
              </li>
            </ul>
          </div>

          <div className="compliance-card compliance-card--full">
            <T as="h3" cs="Právní dokumenty" en="Legal documents" />
            <div className="compliance-links">
              <Link href="/terms">
                <T cs="Všeobecné obchodní podmínky" en="Terms and Conditions" />
              </Link>
              <Link href="/complaints">
                <T cs="Reklamační podmínky, vrácení peněz a storno" en="Complaints policy, refunds and cancellations" />
              </Link>
              <Link href="/privacy">
                <T cs="Ochrana osobních údajů" en="Privacy policy" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
