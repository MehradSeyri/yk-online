"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { T, useT } from "./t";

export function Contact() {
  const [success, setSuccess] = useState(false);
  const t = useT();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.currentTarget.reset();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <section className="contact section" id="contact">
      <div className="container">
        <div className="section-header">
          <T as="span" className="section-badge" cs="Napište nám" en="Get in touch" />
          <T as="h2" cs="Kontakt" en="Contact" />
          <T as="p" cs="Máte otázky? Rádi odpovíme." en="Have questions? We'd be happy to answer." />
        </div>
        <div className="contact__grid">
          <form className="contact__form" onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="cName">
                <T cs="Jméno" en="Name" />
              </label>
              <input type="text" id="cName" name="name" autoComplete="name" required placeholder=" " />
            </div>
            <div className="form-group">
              <label htmlFor="cEmail">
                <T cs="E-mail" en="E-mail" />
              </label>
              <input type="email" id="cEmail" name="email" autoComplete="email" required placeholder=" " />
            </div>
            <div className="form-group">
              <label htmlFor="cMsg">
                <T cs="Zpráva" en="Message" />
              </label>
              <textarea id="cMsg" name="message" rows={5} required placeholder=" " />
            </div>
            <button type="submit" className="btn btn--primary btn--full">
              <T cs="Odeslat zprávu" en="Send message" />
            </button>
            <p className={`form__success${success ? "" : " hidden"}`}>
              {t(
                "Zpráva odeslána! Brzy se vám ozveme.",
                "Message sent! We'll get back to you shortly."
              )}
            </p>
          </form>
          <div className="contact__info">
            <div className="contact__info-item">
              <span className="contact__icon">✉</span>
              <a href="mailto:info@yk-online.eu">info@yk-online.eu</a>
            </div>
            <div className="contact__info-item">
              <span className="contact__icon">🌐</span>
              <a href="https://yk-online.eu" target="_blank" rel="noopener noreferrer">
                yk-online.eu
              </a>
            </div>
            <div className="contact__info-item">
              <span className="contact__icon">☎</span>
              <a href="tel:+420775170443">+420 775 170 443</a>
            </div>
            <div className="contact__info-item">
              <span className="contact__icon">📍</span>
              <span>Radimovická 1773/15, Chodov, 149 00 Praha</span>
            </div>
            <div className="contact__info-item">
              <span className="contact__icon">🏢</span>
              <T cs="IČO: 24062421" en="Company ID: 24062421" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Link href="/" className="logo">
          YK<span>-Online</span>
        </Link>
        <nav className="footer__links">
          <Link href="/contact">
            <T cs="Kontakt" en="Contact" />
          </Link>
          <Link href="/terms">
            <T cs="Obchodní podmínky" en="Terms & Conditions" />
          </Link>
          <Link href="/complaints">
            <T cs="Reklamační řád" en="Complaints Policy" />
          </Link>
          <Link href="/privacy">
            <T cs="Ochrana osobních údajů" en="Privacy Policy" />
          </Link>
        </nav>
        <T
          as="p"
          className="footer__company"
          html
          cs="YK Online, s.r.o. &nbsp;|&nbsp; IČO: 24062421"
          en="YK Online, s.r.o. &nbsp;|&nbsp; Company ID: 24062421"
        />
        <div className="footer__payments">
          <span className="pay-badge pay-badge--visa">VISA</span>
          <span className="pay-badge pay-badge--mc">Mastercard</span>
          <T
            as="span"
            className="footer__secure"
            cs="🔒 Online platby kartou přes Comgate (aktivace probíhá)"
            en="🔒 Online card payments via Comgate (activation in progress)"
          />
        </div>
        <T
          as="p"
          html
          cs="&copy; 2026 YK-Online. Všechna práva vyhrazena."
          en="&copy; 2026 YK-Online. All rights reserved."
        />
      </div>
    </footer>
  );
}
