"use client";

import Link from "next/link";
import { useState } from "react";
import { useSite } from "./site-context";
import { T } from "./t";

export function Navbar() {
  const { lang, toggleLang, isLoggedIn, openModal, logout } = useSite();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link href="/" className="logo">
          YK<span>-Online</span>
        </Link>
        <nav className={`nav-links${navOpen ? " open" : ""}`} id="navLinks">
          <Link href="/#categories" onClick={() => setNavOpen(false)}>
            <T cs="Co nabízíme" en="What we offer" />
          </Link>
          <Link href="/#products" onClick={() => setNavOpen(false)}>
            <T cs="Katalog" en="Catalog" />
          </Link>
          <Link href="/#contact" onClick={() => setNavOpen(false)}>
            <T cs="Kontakt" en="Contact" />
          </Link>
        </nav>
        <div className="navbar__actions">
          <button
            className="lang-btn"
            onClick={toggleLang}
            aria-label="Switch language"
            title="Switch language"
          >
            {lang === "cs" ? "EN" : "CS"}
          </button>

          {isLoggedIn && (
            <button
              className="btn btn--outline"
              id="dashBtn"
              onClick={() => openModal("dashboard")}
            >
              <T cs="Můj účet" en="My account" />
            </button>
          )}

          <button
            className="btn btn--outline"
            id="loginBtn"
            onClick={() => (isLoggedIn ? logout() : openModal("login"))}
          >
            {isLoggedIn ? (
              <T cs="Odhlásit se" en="Log out" />
            ) : (
              <T cs="Přihlásit se" en="Log in" />
            )}
          </button>

          {!isLoggedIn && (
            <button
              className="btn btn--primary"
              id="registerBtn"
              onClick={() => openModal("register")}
            >
              <T cs="Registrovat se" en="Sign up" />
            </button>
          )}
        </div>
        <button
          className="hamburger"
          aria-label="Menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
