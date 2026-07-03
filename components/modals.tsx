"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useSite } from "./site-context";
import { T } from "./t";

function validateEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

const FIELD_ERROR_STYLE = {
  color: "#ef4444",
  fontSize: ".8125rem",
  marginTop: "4px",
  display: "block",
} as const;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <span className="field-error" style={FIELD_ERROR_STYLE}>
      {msg}
    </span>
  );
}

function errBorder(has: boolean) {
  return has ? { borderColor: "#ef4444" } : undefined;
}

/** Generic overlay wrapper: click outside / X closes. */
function Overlay({
  labelledBy,
  modalClass,
  children,
}: {
  labelledBy: string;
  modalClass?: string;
  children: ReactNode;
}) {
  const { closeModals } = useSite();
  const onOverlay = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModals();
  };
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onOverlay}
    >
      <div className={`modal${modalClass ? " " + modalClass : ""}`}>
        <button className="modal__close" aria-label="Close" onClick={closeModals}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function LoginModal() {
  const { lang, login, openModal } = useSite();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const next: Record<string, string> = {};
    if (!validateEmail(email.trim()))
      next.email = lang === "cs" ? "Zadejte platný e-mail." : "Please enter a valid e-mail.";
    if (password.length < 1)
      next.password = lang === "cs" ? "Zadejte heslo." : "Please enter your password.";
    if (Object.keys(next).length) return setErrors(next);

    const loginErr = login(email, password);
    if (loginErr) setErrors({ password: loginErr });
    else setErrors({});
  };

  return (
    <Overlay labelledBy="loginTitle">
      <T as="h2" id="loginTitle" cs="Přihlásit se" en="Log in" />
      <form className="modal__form" onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="loginEmail">
            <T cs="E-mail" en="E-mail" />
          </label>
          <input type="email" id="loginEmail" name="email" autoComplete="email" required placeholder=" " style={errBorder(!!errors.email)} />
          <FieldError msg={errors.email} />
        </div>
        <div className="form-group">
          <label htmlFor="loginPassword">
            <T cs="Heslo" en="Password" />
          </label>
          <input type="password" id="loginPassword" name="password" autoComplete="current-password" required placeholder=" " style={errBorder(!!errors.password)} />
          <FieldError msg={errors.password} />
        </div>
        <button type="submit" className="btn btn--primary btn--full">
          <T cs="Přihlásit se" en="Log in" />
        </button>
        <p className="modal__switch">
          <T cs="Nemáte účet? " en="No account? " />
          <button type="button" className="link-btn" onClick={() => openModal("register")}>
            <T cs="Zaregistrujte se" en="Sign up" />
          </button>
        </p>
      </form>
    </Overlay>
  );
}

function RegisterModal() {
  const { lang, register, openModal } = useSite();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const password2 = (form.elements.namedItem("password2") as HTMLInputElement).value;
    const next: Record<string, string> = {};
    if (name.trim().length < 2)
      next.name = lang === "cs" ? "Zadejte své jméno." : "Please enter your name.";
    if (!validateEmail(email.trim()))
      next.email = lang === "cs" ? "Zadejte platný e-mail." : "Please enter a valid e-mail.";
    if (password.length < 8)
      next.password = lang === "cs" ? "Heslo musí mít alespoň 8 znaků." : "Password must be at least 8 characters.";
    if (password2 !== password)
      next.password2 = lang === "cs" ? "Hesla se neshodují." : "Passwords do not match.";
    if (Object.keys(next).length) return setErrors(next);

    register(name, email);
  };

  return (
    <Overlay labelledBy="registerTitle">
      <T as="h2" id="registerTitle" cs="Registrovat se" en="Sign up" />
      <form className="modal__form" onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="regName">
            <T cs="Jméno" en="Full name" />
          </label>
          <input type="text" id="regName" name="name" autoComplete="name" required placeholder=" " style={errBorder(!!errors.name)} />
          <FieldError msg={errors.name} />
        </div>
        <div className="form-group">
          <label htmlFor="regEmail">
            <T cs="E-mail" en="E-mail" />
          </label>
          <input type="email" id="regEmail" name="email" autoComplete="email" required placeholder=" " style={errBorder(!!errors.email)} />
          <FieldError msg={errors.email} />
        </div>
        <div className="form-group">
          <label htmlFor="regPassword">
            <T cs="Heslo" en="Password" />
          </label>
          <input type="password" id="regPassword" name="password" autoComplete="new-password" required placeholder=" " minLength={8} style={errBorder(!!errors.password)} />
          <span className="form-hint">
            <T cs="Minimálně 8 znaků" en="At least 8 characters" />
          </span>
          <FieldError msg={errors.password} />
        </div>
        <div className="form-group">
          <label htmlFor="regPassword2">
            <T cs="Heslo znovu" en="Confirm password" />
          </label>
          <input type="password" id="regPassword2" name="password2" autoComplete="new-password" required placeholder=" " style={errBorder(!!errors.password2)} />
          <FieldError msg={errors.password2} />
        </div>
        <button type="submit" className="btn btn--primary btn--full">
          <T cs="Vytvořit účet" en="Create account" />
        </button>
        <p className="modal__switch">
          <T cs="Již máte účet? " en="Already have an account? " />
          <button type="button" className="link-btn" onClick={() => openModal("login")}>
            <T cs="Přihlaste se" en="Log in" />
          </button>
        </p>
      </form>
    </Overlay>
  );
}

const BANK_ACCOUNTS = {
  CZK: "CZ6303000000000366778458",
  EUR: "CZ9203000000000371157680",
} as const;

function parsePrice(text: string): { amount: number; currency: "CZK" | "EUR" } {
  if (!text) return { amount: 0, currency: "CZK" };
  const currency = text.includes("€") || text.includes("EUR") ? "EUR" : "CZK";
  const amount = Number(text.replace(/[^0-9]/g, "")) || 0;
  return { amount, currency };
}

function createTransferQrUrl(
  iban: string,
  amount: number,
  currency: string,
  message: string
): string {
  const am = Number(amount || 0).toFixed(2);
  const vs = String(Date.now()).slice(-10);
  const safeMsg = String(message || "YK-Online")
    .replace(/[^a-zA-Z0-9 .\-]/g, " ")
    .trim()
    .slice(0, 60);
  const payload = [
    "SPD*1.0",
    `ACC:${iban}`,
    `AM:${am}`,
    `CC:${currency}`,
    `X-VS:${vs}`,
    `MSG:${safeMsg}`,
  ].join("*");
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    payload
  )}`;
}

function InquiryModal() {
  const { lang, inquiry, userName, userEmail, addOrder, closeModals } = useSite();
  const [method, setMethod] = useState<"card" | "bank">("card");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset transient UI each time a new inquiry opens.
  useEffect(() => {
    setMethod("card");
    setErrors({});
    setDone(false);
    setSubmitting(false);
  }, [inquiry]);

  const productName = inquiry?.name ?? "";
  const priceText = inquiry?.price ?? "";
  const parsed = parsePrice(priceText);
  const iban = parsed.currency === "EUR" ? BANK_ACCOUNTS.EUR : BANK_ACCOUNTS.CZK;
  const qrUrl =
    method === "bank" && parsed.amount > 0
      ? createTransferQrUrl(iban, parsed.amount, parsed.currency, `YK-Online ${productName}`)
      : "";

  const qrNote =
    method === "bank"
      ? parsed.amount > 0
        ? lang === "cs"
          ? "QR kód je připraven pro okamžitou platbu převodem."
          : "QR code is ready for instant bank transfer payment."
        : lang === "cs"
        ? "U této položky není pevná částka. QR kód se vygeneruje po potvrzení ceny."
        : "This item has no fixed amount. QR code will be generated after price confirmation."
      : lang === "cs"
      ? "Po výběru bankovního převodu se vygeneruje QR kód pro platbu."
      : "After selecting bank transfer, a payment QR code will be generated.";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
    const next: Record<string, string> = {};
    if (name.trim().length < 2)
      next.name = lang === "cs" ? "Zadejte své jméno." : "Please enter your name.";
    if (!validateEmail(email.trim()))
      next.email = lang === "cs" ? "Zadejte platný e-mail." : "Please enter a valid e-mail.";
    if (Object.keys(next).length) return setErrors(next);

    setErrors({});

    if (method === "card") {
      setSubmitting(true);
      try {
        const res = await fetch("/api/public-checkout", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            productName,
            amount: parsed.amount,
            currency: parsed.currency,
            lang,
            customerName: name.trim(),
            customerEmail: email.trim(),
            customerPhone: phone.trim(),
          }),
        });

        const data = (await res.json()) as {
          checkoutUrl?: string;
          orderId?: string;
          error?: string;
        };

        if (!res.ok || !data.checkoutUrl) {
          setErrors({
            submit:
              (lang === "cs"
                ? "Platbu se nepodařilo založit. Zkuste to prosím znovu."
                : "Payment could not be initialized. Please try again.") +
              (data.error ? ` (${data.error})` : ""),
          });
          return;
        }

        addOrder({
          product: productName,
          price: priceText,
          paymentMethod: method,
          date: new Date().toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB"),
          status: lang === "cs" ? "Čeká na úhradu" : "Awaiting payment",
        });

        window.location.assign(data.checkoutUrl);
        return;
      } catch {
        setErrors({
          submit:
            lang === "cs"
              ? "Došlo k chybě připojení. Zkuste to prosím znovu."
              : "Connection error occurred. Please try again.",
        });
        return;
      } finally {
        setSubmitting(false);
      }
    }

    addOrder({
      product: productName,
      price: priceText,
      paymentMethod: method,
      date: new Date().toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB"),
      status: lang === "cs" ? "Vyřizuje se" : "Processing",
    });
    setDone(true);
  };

  return (
    <Overlay labelledBy="inquiryTitle" modalClass="modal--inquiry">
      <T as="h2" id="inquiryTitle" cs="Zájem o produkt" en="Product inquiry" />
      <div className="inquiry__product">
        <span className="inquiry__product-name">{productName}</span>
        <span className="inquiry__product-price">{priceText}</span>
      </div>

      {!done && (
        <>
          <div className="inquiry__method">
            <T as="p" className="inquiry__method-title" cs="Způsob úhrady" en="Payment method" />
            <label className="inquiry__method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={method === "card"}
                onChange={() => setMethod("card")}
              />
              <T cs="Online platba kartou (Comgate)" en="Online card payment (Comgate)" />
            </label>
            <label className="inquiry__method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={method === "bank"}
                onChange={() => setMethod("bank")}
              />
              <T cs="Bankovní převod" en="Bank transfer" />
            </label>
          </div>

          <div className={`bankpay${method === "bank" ? "" : " hidden"}`}>
            <T as="p" className="bankpay__title" cs="Platební údaje pro bankovní převod" en="Bank transfer payment details" />
            <div className="bankpay__accounts">
              <div>
                <T as="p" className="bankpay__label" cs="Bankovní účet v CZK" en="Bank account in CZK" />
                <p className="bankpay__value">366778458/0300</p>
              </div>
              <div>
                <T as="p" className="bankpay__label" cs="Bankovní účet v EUR" en="Bank account in EUR" />
                <p className="bankpay__value">CZ9203000000000371157680</p>
              </div>
            </div>
            <div className="bankpay__qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Bank transfer QR"
                className={qrUrl ? "" : "hidden"}
                src={qrUrl || undefined}
              />
              <p className="bankpay__qr-note">{qrNote}</p>
            </div>
          </div>

          <form className="modal__form" onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="inqName">
                <T cs="Jméno a příjmení" en="Full name" />
              </label>
              <input type="text" id="inqName" name="name" autoComplete="name" required placeholder=" " defaultValue={userName} style={errBorder(!!errors.name)} />
              <FieldError msg={errors.name} />
            </div>
            <div className="form-group">
              <label htmlFor="inqEmail">
                <T cs="E-mail" en="E-mail" />
              </label>
              <input type="email" id="inqEmail" name="email" autoComplete="email" required placeholder=" " defaultValue={userEmail} style={errBorder(!!errors.email)} />
              <FieldError msg={errors.email} />
            </div>
            <div className="form-group">
              <label htmlFor="inqPhone">
                <T cs="Telefon (nepovinné)" en="Phone (optional)" />
              </label>
              <input type="tel" id="inqPhone" name="phone" autoComplete="tel" placeholder=" " />
            </div>
            <div className="form-group">
              <label htmlFor="inqMsg">
                <T cs="Zpráva / dotaz" en="Message / question" />
              </label>
              <textarea id="inqMsg" name="message" rows={3} placeholder=" " />
            </div>
            <button type="submit" className="btn btn--primary btn--full">
              {method === "card" ? (
                <T cs="Pokračovat k platbě" en="Continue to payment" />
              ) : (
                <T cs="Odeslat poptávku" en="Send inquiry" />
              )}
            </button>
            <FieldError msg={errors.submit} />
            <T
              as="p"
              className="inquiry__note"
              cs={
                method === "card"
                  ? "Po potvrzení budete přesměrováni na zabezpečenou platební bránu."
                  : "Ozveme se vám do 24 hodin s platebními instrukcemi."
              }
              en={
                method === "card"
                  ? "After confirmation you will be redirected to a secure payment gateway."
                  : "We will get back to you within 24 hours with payment instructions."
              }
            />
          </form>
        </>
      )}

      {done && (
        <div className="inquiry__success">
          <div className="inquiry__success-icon">✓</div>
          <T as="h3" cs="Poptávka odeslána!" en="Inquiry sent!" />
          <T
            as="p"
            cs="Děkujeme za zájem. Ozveme se vám na zadaný e-mail do 24 hodin s dalšími kroky."
            en="Thank you for your interest. We will contact you at the provided e-mail within 24 hours with next steps."
          />
          <button type="button" className="btn btn--outline btn--full" onClick={closeModals}>
            <T cs="Zavřít" en="Close" />
          </button>
        </div>
      )}
    </Overlay>
  );
}

function DashboardModal() {
  const { lang, userName, userEmail, orders, logout } = useSite();
  const displayName = userName || (lang === "cs" ? "Uživatel" : "User");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Overlay labelledBy="dashboardTitle" modalClass="modal--dashboard">
      <div className="dash__header">
        <div className="dash__avatar">{initials}</div>
        <div>
          <h2 id="dashboardTitle" style={{ marginBottom: 2, fontSize: "1.25rem" }}>
            {lang === "cs" ? `Dobrý den, ${displayName}` : `Hello, ${displayName}`}
          </h2>
          <p className="dash__email">{userEmail}</p>
        </div>
      </div>
      <div className="dash__section">
        <T as="h3" cs="Moje poptávky" en="My inquiries" />
        <div>
          {orders.length === 0 ? (
            <p className="dash__empty">
              {lang === "cs" ? "Zatím žádné poptávky." : "No inquiries yet."}
            </p>
          ) : (
            orders.map((o, i) => (
              <div className="dash__order" key={i}>
                <div className="dash__order-info">
                  <span className="dash__order-name">{o.product}</span>
                  <span className="dash__order-date">{o.date}</span>
                </div>
                <div className="dash__order-right">
                  <span className="dash__order-price">{o.price}</span>
                  <span className="dash__order-method">
                    {(o.paymentMethod || "card") === "bank"
                      ? lang === "cs"
                        ? "Bankovní převod"
                        : "Bank transfer"
                      : lang === "cs"
                      ? "Platba kartou"
                      : "Card payment"}
                  </span>
                  <span className="dash__order-status">
                    {lang === "cs" ? "Vyřizuje se" : "Processing"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <button type="button" className="btn btn--outline btn--full dash__logout" onClick={logout}>
        <T cs="Odhlásit se" en="Log out" />
      </button>
    </Overlay>
  );
}

export function Modals() {
  const { activeModal } = useSite();
  return (
    <>
      {activeModal === "login" && <LoginModal />}
      {activeModal === "register" && <RegisterModal />}
      {activeModal === "inquiry" && <InquiryModal />}
      {activeModal === "dashboard" && <DashboardModal />}
    </>
  );
}

export function Toast() {
  const { toast } = useSite();
  return (
    <div className={`toast${toast ? "" : " hidden"}`} role="status" aria-live="polite">
      {toast}
    </div>
  );
}
