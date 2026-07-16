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

function parsePrice(text: string): { amount: number; currency: "CZK" | "EUR" } {
  if (!text) return { amount: 0, currency: "CZK" };
  const currency = text.includes("€") || text.includes("EUR") ? "EUR" : "CZK";
  const amount = Number(text.replace(/[^0-9]/g, "")) || 0;
  return { amount, currency };
}

type CheckoutCurrency = "CZK" | "EUR" | "PLN" | "RON";

const CURRENCY_RATES: Record<CheckoutCurrency, number> = {
  EUR: 1,
  CZK: 25,
  PLN: 4.3,
  RON: 5,
};

const CURRENCY_LABELS: Record<CheckoutCurrency, string> = {
  CZK: "Kc",
  EUR: "EUR",
  PLN: "PLN",
  RON: "RON",
};

const ADD_ONS = [
  { id: "priority", priceEur: 1, cs: "Prioritni doruceni", en: "Priority delivery" },
  { id: "invoice-check", priceEur: 3, cs: "Kontrola fakturacnich udaju", en: "Invoice details review" },
  { id: "checklist", priceEur: 5, cs: "Implementacni checklist", en: "Implementation checklist" },
  { id: "team-notes", priceEur: 7, cs: "Poznamky pro tymove nasazeni", en: "Team onboarding notes" },
  { id: "setup-call", priceEur: 10, cs: "30min konzultace k nastaveni", en: "30-minute setup call" },
] as const;

function convertAmount(
  amount: number,
  from: "CZK" | "EUR",
  to: CheckoutCurrency
): number {
  const eur = from === "EUR" ? amount : amount / CURRENCY_RATES.CZK;
  const converted = eur * CURRENCY_RATES[to];
  return Math.round(converted * 100) / 100;
}

function formatMoney(amount: number, currency: CheckoutCurrency): string {
  if (currency === "CZK") return `${Math.round(amount).toLocaleString("cs-CZ")} Kc`;
  return `${amount.toFixed(2)} ${currency}`;
}

const BANK_ACCOUNTS = {
  CZK: "CZ6303000000000366778458",
  EUR: "CZ9203000000000371157680",
} as const;

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
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    payload
  )}`;
}

function InquiryModal() {
  const { lang, inquiry, userName, userEmail, addOrder, closeModals } = useSite();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<"" | "bank" | "card">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("CZ");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponStatus, setCouponStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [selectedCurrency, setSelectedCurrency] = useState<CheckoutCurrency>(
    lang === "cs" ? "CZK" : "EUR"
  );
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Reset transient UI each time a new checkout opens.
  useEffect(() => {
    setStep(1);
    setMethod("");
    setName(userName || "");
    setEmail(userEmail || "");
    setPhone("");
    setStreet("");
    setCity("");
    setZip("");
    setCountry("CZ");
    setAgreeTerms(true);
    setNewsletter(false);
    setDone(false);
    setErrors({});
    setSubmitting(false);
    setCouponInput("");
    setCouponApplied("");
    setCouponDiscount(0);
    setCouponStatus("idle");
    setSelectedCurrency(lang === "cs" ? "CZK" : "EUR");
    setSelectedAddOns([]);
  }, [inquiry, userName, userEmail, lang]);

  const productName = inquiry?.name ?? "";
  const priceText = inquiry?.price ?? "";
  const parsed = parsePrice(priceText);
  const hasFixedPrice = parsed.amount > 0;
  const canUseBankTransfer = selectedCurrency === "CZK" || selectedCurrency === "EUR";
  const checkoutIban =
    selectedCurrency === "EUR" ? BANK_ACCOUNTS.EUR : BANK_ACCOUNTS.CZK;
  const selectedAddOnItems = ADD_ONS.filter((a) => selectedAddOns.includes(a.id));
  const checkoutBaseAmount = convertAmount(parsed.amount, parsed.currency, selectedCurrency);
  const checkoutAddOnsAmount = selectedAddOnItems.reduce(
    (sum, item) => sum + convertAmount(item.priceEur, "EUR", selectedCurrency),
    0
  );
  const checkoutSubtotalAmount =
    Math.round((checkoutBaseAmount + checkoutAddOnsAmount) * 100) / 100;
  const checkoutFinalAmount =
    couponDiscount > 0
      ? Math.round(checkoutSubtotalAmount * (100 - couponDiscount) / 100 * 100) / 100
      : checkoutSubtotalAmount;
  const checkoutFinalPriceDisplay = formatMoney(checkoutFinalAmount, selectedCurrency);
  const checkoutProductName =
    selectedAddOnItems.length > 0
      ? `${productName} + ${selectedAddOnItems
          .map((item) => (lang === "cs" ? item.cs : item.en))
          .join(", ")}`
      : productName;

  const qrUrl =
    hasFixedPrice
      ? createTransferQrUrl(checkoutIban, checkoutFinalAmount, selectedCurrency, `YK-Online ${checkoutProductName}`)
      : "";

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponStatus("checking");
    try {
      const res = await fetch(`/api/validate-coupon?code=${encodeURIComponent(code)}`);
      const data = (await res.json()) as { valid: boolean; discount?: number };
      if (data.valid && typeof data.discount === "number") {
        setCouponApplied(code.toUpperCase());
        setCouponDiscount(data.discount);
        setCouponStatus("valid");
      } else {
        setCouponApplied("");
        setCouponDiscount(0);
        setCouponStatus("invalid");
      }
    } catch {
      setCouponStatus("invalid");
    }
  };

  const validateStep = (current: 1 | 2 | 3): boolean => {
    const next: Record<string, string> = {};
    if (current === 1) {
      if (name.trim().length < 2)
        next.name =
          lang === "cs" ? "Zadejte jméno a příjmení." : "Please enter full name.";
      if (!validateEmail(email.trim()))
        next.email =
          lang === "cs" ? "Zadejte platný e-mail." : "Please enter a valid e-mail.";
    }
    if (current === 2) {
      if (street.trim().length < 3)
        next.street = lang === "cs" ? "Vyplňte ulici a číslo." : "Please enter street and number.";
      if (city.trim().length < 2)
        next.city = lang === "cs" ? "Vyplňte město." : "Please enter city.";
      if (zip.trim().length < 3)
        next.zip = lang === "cs" ? "Vyplňte PSČ." : "Please enter ZIP/postal code.";
    }
    if (current === 3 && !agreeTerms) {
      next.terms =
        lang === "cs"
          ? "Pro pokračování potvrďte souhlas s podmínkami."
          : "Please accept terms to continue.";
    }
    if (current === 3 && !method) {
      next.payment =
        lang === "cs"
          ? "Vyberte platebni metodu."
          : "Please choose a payment method.";
    }
    if (current === 3 && method === "bank" && !canUseBankTransfer) {
      next.payment =
        lang === "cs"
          ? "QR prevod je dostupny jen pro CZK a EUR. Pro tuto menu zvolte kartu."
          : "QR bank transfer is available only for CZK and EUR. Choose card for this currency.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  };

  const prevStep = () => {
    setErrors({});
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!hasFixedPrice) {
      setErrors({
        submit:
          lang === "cs"
            ? "Tento produkt má individuální cenu. Použijte prosím kontaktní formulář."
            : "This product has custom pricing. Please use the contact form.",
      });
      return;
    }

    if (!validateStep(3)) return;

    if (method === "bank") {
      addOrder({
        product: checkoutProductName,
        price: checkoutFinalPriceDisplay,
        paymentMethod: "bank",
        date: new Date().toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB"),
        status: lang === "cs" ? "Čeká na úhradu (QR)" : "Awaiting payment (QR)",
      });
      setDone(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public-checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          productName: checkoutProductName,
          amount: checkoutFinalAmount,
          currency: selectedCurrency,
          lang,
          couponCode: couponApplied || undefined,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          countryCode: country,
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
        orderId: data.orderId,
        product: checkoutProductName,
        price: checkoutFinalPriceDisplay,
        paymentMethod: "card",
        date: new Date().toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB"),
        status: lang === "cs" ? "Objednávka vytvořena" : "Order created",
      });

      window.location.assign(data.checkoutUrl);
    } catch {
      setErrors({
        submit:
          lang === "cs"
            ? "Došlo k chybě připojení. Zkuste to prosím znovu."
            : "Connection error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel = (target: 1 | 2 | 3) => {
    if (target === 1) return lang === "cs" ? "Kontakt" : "Contact";
    if (target === 2) return lang === "cs" ? "Fakturační údaje" : "Billing details";
    return lang === "cs" ? "Kontrola a platba" : "Review & pay";
  };

  return (
    <Overlay labelledBy="inquiryTitle" modalClass="modal--inquiry">
      <T as="h2" id="inquiryTitle" cs="Dokončení objednávky" en="Complete your order" />
      <div className="inquiry__product">
        <div>
          <span className="inquiry__product-name">{productName}</span>
          <span className="inquiry__product-subline">
            {lang === "cs" ? "Digitální produkt • doručení ihned po zaplacení" : "Digital product • delivered instantly after payment"}
          </span>
        </div>
        <span className="inquiry__product-price">{checkoutFinalPriceDisplay || (lang === "cs" ? "Na dotaz" : "On request")}</span>
      </div>

      {!hasFixedPrice ? (
        <div className="inquiry__success">
          <div className="inquiry__success-icon">!</div>
          <T as="h3" cs="Tento produkt má cenu na vyžádání" en="This product is priced on request" />
          <T
            as="p"
            cs="Pro individuální nabídku nám napište přes kontaktní stránku. Pro ostatní produkty můžete dokončit online objednávku kartou."
            en="Please use the contact page for a custom quote. Fixed-price products can be purchased online by card."
          />
          <button type="button" className="btn btn--outline btn--full" onClick={closeModals}>
            <T cs="Rozumím" en="Understood" />
          </button>
        </div>
      ) : done ? (
        <div className="inquiry__success">
          <div className="inquiry__success-icon">QR</div>
          <T as="h3" cs="Objednávka vytvořena" en="Order created" />
          <T
            as="p"
            cs="Dokončete prosím úhradu pomocí QR kódu. Po připsání platby vám produkt doručíme e-mailem."
            en="Please complete the payment using the QR code. After funds are received, your product will be delivered by e-mail."
          />
          <div className="checkout-summary" style={{ width: "100%" }}>
            <div className="checkout-summary__row">
              <span>{lang === "cs" ? "Produkt" : "Product"}</span>
              <strong>{checkoutProductName}</strong>
            </div>
            <div className="checkout-summary__row">
              <span>{lang === "cs" ? "Částka" : "Amount"}</span>
              <strong>{checkoutFinalPriceDisplay}</strong>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="Bank transfer QR" style={{ width: 220, height: 220, borderRadius: 12, border: "1px solid #d7e0ea", padding: 6, background: "#fff" }} />
          <p className="inquiry__note">
            {lang === "cs"
              ? `Ucet ${selectedCurrency}: ${checkoutIban}`
              : `${selectedCurrency} account: ${checkoutIban}`}
          </p>
          <button type="button" className="btn btn--outline btn--full" onClick={closeModals}>
            <T cs="Zavřít" en="Close" />
          </button>
        </div>
      ) : (
        <form className="modal__form" onSubmit={onSubmit} noValidate>
          <div className="checkout-steps" aria-label="Checkout steps">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`checkout-step${step >= s ? " is-active" : ""}`}>
                <span className="checkout-step__dot">{s}</span>
                <span className="checkout-step__label">{stepLabel(s as 1 | 2 | 3)}</span>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="checkout-panel">
              <h3>{lang === "cs" ? "Kontaktní údaje" : "Contact details"}</h3>
              <div className="form-group">
                <label htmlFor="inqName">
                  <T cs="Jméno a příjmení" en="Full name" />
                </label>
                <input type="text" id="inqName" autoComplete="name" required placeholder=" " value={name} onChange={(e) => setName(e.target.value)} style={errBorder(!!errors.name)} />
                <FieldError msg={errors.name} />
              </div>
              <div className="form-group">
                <label htmlFor="inqEmail">
                  <T cs="E-mail" en="E-mail" />
                </label>
                <input type="email" id="inqEmail" autoComplete="email" required placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} style={errBorder(!!errors.email)} />
                <FieldError msg={errors.email} />
              </div>
              <div className="form-group">
                <label htmlFor="inqPhone">
                  <T cs="Telefon (nepovinné)" en="Phone (optional)" />
                </label>
                <input type="tel" id="inqPhone" autoComplete="tel" placeholder=" " value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-panel">
              <h3>{lang === "cs" ? "Fakturační údaje" : "Billing details"}</h3>
              <div className="form-group">
                <label htmlFor="inqStreet">
                  <T cs="Ulice a číslo" en="Street and number" />
                </label>
                <input type="text" id="inqStreet" autoComplete="address-line1" required placeholder=" " value={street} onChange={(e) => setStreet(e.target.value)} style={errBorder(!!errors.street)} />
                <FieldError msg={errors.street} />
              </div>
              <div className="checkout-grid-2">
                <div className="form-group">
                  <label htmlFor="inqCity">
                    <T cs="Město" en="City" />
                  </label>
                  <input type="text" id="inqCity" autoComplete="address-level2" required placeholder=" " value={city} onChange={(e) => setCity(e.target.value)} style={errBorder(!!errors.city)} />
                  <FieldError msg={errors.city} />
                </div>
                <div className="form-group">
                  <label htmlFor="inqZip">
                    <T cs="PSČ" en="ZIP" />
                  </label>
                  <input type="text" id="inqZip" autoComplete="postal-code" required placeholder=" " value={zip} onChange={(e) => setZip(e.target.value)} style={errBorder(!!errors.zip)} />
                  <FieldError msg={errors.zip} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="inqCountry">
                  <T cs="Země" en="Country" />
                </label>
                <select
                  id="inqCountry"
                  className="checkout-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="CZ">Czechia</option>
                  <option value="SK">Slovakia</option>
                  <option value="DE">Germany</option>
                  <option value="AT">Austria</option>
                  <option value="PL">Poland</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="checkout-panel">
              <h3>{lang === "cs" ? "Shrnutí objednávky" : "Order summary"}</h3>
              <div className="checkout-summary">
                <div className="checkout-summary__row">
                  <span>{lang === "cs" ? "Produkt" : "Product"}</span>
                  <strong>{productName}</strong>
                </div>
                <div className="checkout-summary__row">
                  <span>{lang === "cs" ? (couponDiscount > 0 ? "Původní cena" : "Cena") : (couponDiscount > 0 ? "Original price" : "Price")}</span>
                  <strong>{formatMoney(checkoutBaseAmount, selectedCurrency)}</strong>
                </div>
                {selectedAddOnItems.length > 0 && (
                  <div className="checkout-summary__row">
                    <span>{lang === "cs" ? "Priplatky" : "Add-ons"}</span>
                    <strong>{formatMoney(checkoutAddOnsAmount, selectedCurrency)}</strong>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="checkout-summary__row checkout-summary__discount">
                    <span>{lang === "cs" ? `Sleva (${couponDiscount} %)` : `Discount (${couponDiscount}%)`}</span>
                    <strong>
                      -{formatMoney(checkoutSubtotalAmount - checkoutFinalAmount, selectedCurrency)}
                    </strong>
                  </div>
                )}
                <div className="checkout-summary__row">
                  <span>{lang === "cs" ? "Doručení" : "Delivery"}</span>
                  <strong>{lang === "cs" ? "Ihned e-mailem" : "Instant via e-mail"}</strong>
                </div>
                <div className="checkout-summary__row checkout-summary__total">
                  <span>{lang === "cs" ? "Celkem" : "Total"}</span>
                  <strong>{checkoutFinalPriceDisplay}</strong>
                </div>
              </div>

              <div className="checkout-panel" style={{ padding: 0, border: 0, marginTop: 16 }}>
                <div className="form-group">
                  <label htmlFor="checkoutCurrency">
                    {lang === "cs" ? "Mena platby" : "Payment currency"}
                  </label>
                  <select
                    id="checkoutCurrency"
                    className="checkout-select"
                    value={selectedCurrency}
                    onChange={(e) => {
                      const next = e.target.value as CheckoutCurrency;
                      setSelectedCurrency(next);
                      if (next !== "CZK" && next !== "EUR" && method === "bank") {
                        setMethod("card");
                      }
                    }}
                  >
                    <option value="CZK">CZK</option>
                    <option value="EUR">EUR</option>
                    <option value="PLN">PLN</option>
                    <option value="RON">RON</option>
                  </select>
                </div>
                <div className="checkout-payment">
                  <p className="checkout-payment__title">
                    {lang === "cs" ? "Priplatkove sluzby" : "Add-on services"}
                  </p>
                  {ADD_ONS.map((item) => {
                    const checked = selectedAddOns.includes(item.id);
                    const price = formatMoney(
                      convertAmount(item.priceEur, "EUR", selectedCurrency),
                      selectedCurrency
                    );
                    return (
                      <label className="checkout-method-option" key={item.id}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedAddOns((prev) =>
                              e.target.checked
                                ? [...prev, item.id]
                                : prev.filter((id) => id !== item.id)
                            );
                          }}
                        />
                        <span>
                          {lang === "cs" ? item.cs : item.en} (+{price})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Coupon code */}
              <div className="checkout-coupon">
                <label className="checkout-coupon__label">
                  {lang === "cs" ? "Slevový kód" : "Discount code"}
                </label>
                <div className="checkout-coupon__row">
                  <input
                    type="text"
                    className="checkout-coupon__input"
                    placeholder={lang === "cs" ? "Zadejte kód" : "Enter code"}
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); if (couponStatus !== "idle") setCouponStatus("idle"); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                    disabled={couponStatus === "valid"}
                  />
                  {couponStatus === "valid" ? (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => { setCouponInput(""); setCouponApplied(""); setCouponDiscount(0); setCouponStatus("idle"); }}
                    >
                      {lang === "cs" ? "Zrušit" : "Remove"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      disabled={!couponInput.trim() || couponStatus === "checking"}
                      onClick={handleApplyCoupon}
                    >
                      {couponStatus === "checking"
                        ? (lang === "cs" ? "Ověřuji…" : "Checking…")
                        : (lang === "cs" ? "Použít" : "Apply")}
                    </button>
                  )}
                </div>
                {couponStatus === "valid" && (
                  <p className="checkout-coupon__ok">
                    {lang === "cs"
                      ? `✓ Kód ${couponApplied} – sleva ${couponDiscount} %`
                      : `✓ Code ${couponApplied} – ${couponDiscount}% off`}
                  </p>
                )}
                {couponStatus === "invalid" && (
                  <p className="checkout-coupon__err">
                    {lang === "cs" ? "Neplatný slevový kód." : "Invalid discount code."}
                  </p>
                )}
              </div>

              <div className="checkout-payment">
                <p className="checkout-payment__title">
                  {lang === "cs" ? "Platební metoda" : "Payment method"}
                </p>
                <label className="checkout-method-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    disabled={!canUseBankTransfer}
                    checked={method === "bank"}
                    onChange={() => setMethod("bank")}
                  />
                  <span>
                    {lang === "cs"
                      ? "Platba QR kódem (doporučeno)"
                      : "QR code payment (recommended)"}
                  </span>
                </label>
                <label className="checkout-method-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={method === "card"}
                    onChange={() => setMethod("card")}
                  />
                  <span>{lang === "cs" ? "Online platba kartou" : "Online card payment"}</span>
                </label>
                <p className="checkout-payment__hint">
                  {!method
                    ? lang === "cs"
                      ? "Vyberte, zda chcete zaplatit online kartou, nebo bankovnim prevodem pres QR kod."
                      : "Choose whether to pay online by card or by bank transfer using a QR code."
                    : method === "bank"
                    ? lang === "cs"
                      ? "Po potvrzení objednávky se zobrazí QR kód a platební údaje pro okamžitý převod."
                      : "After order confirmation, a QR code and transfer details will be shown."
                    : lang === "cs"
                      ? "Po kliknutí budete bezpečně přesměrováni na zabezpečenou platební bránu."
                      : "After clicking, you will be securely redirected to a secure payment gateway."}
                </p>
                <FieldError msg={errors.payment} />
              </div>

              <label className="checkout-checkline">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  {lang === "cs"
                    ? "Souhlasím s obchodními podmínkami a zásadami ochrany osobních údajů."
                    : "I agree with Terms and Privacy Policy."}
                </span>
              </label>
              <FieldError msg={errors.terms} />

              <label className="checkout-checkline checkout-checkline--muted">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <span>
                  {lang === "cs"
                    ? "Chci dostávat novinky a slevy e-mailem."
                    : "I want to receive updates and offers by e-mail."}
                </span>
              </label>
            </div>
          )}

          <div className="checkout-actions">
            {step > 1 ? (
              <button type="button" className="btn btn--outline" onClick={prevStep}>
                <T cs="Zpět" en="Back" />
              </button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <button type="button" className="btn btn--primary" onClick={nextStep}>
                <T cs="Pokračovat" en="Continue" />
              </button>
            ) : (
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {!method
                  ? lang === "cs"
                    ? "Vyberte platebni metodu"
                    : "Choose payment method"
                  : method === "bank"
                  ? lang === "cs"
                    ? "Objednat a zobrazit QR kód"
                    : "Place order and show QR code"
                  : submitting
                    ? lang === "cs"
                      ? "Připravuji platbu..."
                      : "Preparing payment..."
                    : lang === "cs"
                      ? "Objednat a zaplatit kartou"
                      : "Place order and pay by card"}
              </button>
            )}
          </div>

          <FieldError msg={errors.submit} />
          <p className="inquiry__note">
            {lang === "cs"
              ? "Primární metoda: QR platba převodem • Sekundární metoda: karta"
              : "Primary method: QR bank payment • Secondary method: card"}
          </p>
        </form>
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
        <T as="h3" cs="Moje objednávky" en="My orders" />
        <div>
          {orders.length === 0 ? (
            <p className="dash__empty">
              {lang === "cs" ? "Zatím žádné objednávky." : "No orders yet."}
            </p>
          ) : (
            orders.map((o, i) => (
              <div className="dash__order" key={i}>
                <div className="dash__order-info">
                  <span className="dash__order-name">{o.product}</span>
                  <span className="dash__order-date">{o.date}</span>
                  {o.orderId ? <span className="dash__order-date">#{o.orderId}</span> : null}
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
                  <span className="dash__order-status">{o.status}</span>
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
