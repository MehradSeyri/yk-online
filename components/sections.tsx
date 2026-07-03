"use client";

import Link from "next/link";
import { T } from "./t";

export function Services() {
  return (
    <section className="services section" id="categories">
      <div className="container">
        <div className="section-header">
          <T as="span" className="section-badge" cs="Co nabízíme" en="What we offer" />
          <T as="h2" cs="Digitální produkty & poradenství" en="Digital products & consulting" />
          <T
            as="p"
            cs="Vše, co potřebujete pro úspěšný online marketing a digitální podnikání."
            en="Everything you need for successful online marketing and digital business."
          />
        </div>
        <div className="services__grid">
          <div className="card">
            <div className="card__icon">📄</div>
            <T as="h3" cs="Digitální šablony" en="Digital Templates" />
            <T
              as="p"
              cs="Hotové šablony pro sociální sítě, branding, marketingové plány a prezentace — stáhnout a použít ihned."
              en="Ready-made templates for social media, branding, marketing plans and presentations — download and use immediately."
            />
          </div>
          <div className="card">
            <div className="card__icon">🎓</div>
            <T as="h3" cs="Online kurzy" en="Online Courses" />
            <T
              as="p"
              cs="Video kurzy zaměřené na digitální marketing, SEO, sociální sítě a budování online businessu."
              en="Video courses focused on digital marketing, SEO, social media and building an online business."
            />
          </div>
          <div className="card">
            <div className="card__icon">📈</div>
            <T as="h3" cs="Marketingové poradenství" en="Marketing Consulting" />
            <T
              as="p"
              cs="Strategické poradenství v oblasti digitálního marketingu, brandingu a rozvoje online podnikání."
              en="Strategic consulting in digital marketing, branding and online business development."
            />
          </div>
          <div className="card">
            <div className="card__icon">🔧</div>
            <T as="h3" cs="Nástroje & checklists" en="Tools & Checklists" />
            <T
              as="p"
              cs="Praktické checklisty, audity, pracovní listy a frameworky pro každodenní marketingovou práci."
              en="Practical checklists, audits, worksheets and frameworks for everyday marketing work."
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
              <T as="h4" cs="Okamžité doručení" en="Instant delivery" />
              <T
                as="p"
                cs="Digitální produkty jsou k dispozici okamžitě po dokončení platby — žádné čekání."
                en="Digital products are available immediately after payment — no waiting."
              />
            </div>
          </div>
          <div className="whyus__item">
            <div className="whyus__icon">🔒</div>
            <div>
              <T as="h4" cs="Bezpečná platba" en="Secure payment" />
              <T
                as="p"
                cs="Šifrované platby kartou chráněné ověřenou platební bránou."
                en="Encrypted card payments secured by a certified payment gateway."
              />
            </div>
          </div>
          <div className="whyus__item">
            <div className="whyus__icon">🔄</div>
            <div>
              <T as="h4" cs="14denní garance vrácení peněz" en="14-day money-back guarantee" />
              <T
                as="p"
                cs="Nejste spokojeni? Vrátíme vám peníze do 14 dnů bez zbytečných otázek."
                en="Not satisfied? We'll refund your money within 14 days, no questions asked."
              />
            </div>
          </div>
          <div className="whyus__item">
            <div className="whyus__icon">✓</div>
            <div>
              <T as="h4" cs="Obsah od odborníků" en="Expert-created content" />
              <T
                as="p"
                cs="Všechny produkty vytvořeny marketingovými specialisty s praxí v digitálním prostředí."
                en="All products created by marketing specialists with hands-on digital experience."
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
                <T cs="Objednávku provedete tlačítkem Koupit nyní / Mám zájem u konkrétní položky." en="You can place an order via the Buy now / I'm interested button on each item." />
              </li>
              <li>
                <T cs="Digitální produkty doručujeme elektronicky, zpravidla ihned po úspěšné úhradě." en="Digital products are delivered electronically, usually immediately after successful payment." />
              </li>
              <li>
                <T cs="Online platby kartou připravujeme přes platební bránu Comgate." en="Online card payments are being prepared via the Comgate payment gateway." />
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
