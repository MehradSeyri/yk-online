"use client";

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
