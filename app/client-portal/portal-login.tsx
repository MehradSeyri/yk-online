"use client";

import { FormEvent, useState } from "react";

export function ClientPortalLogin() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    if (!email || !password) {
      setMessage("Enter your billing e-mail and password.");
      return;
    }

    setMessage(
      "Portal access is checked by order e-mail. If your password is not active yet, use the password setup link sent after payment confirmation or contact info@yk-online.eu."
    );
  }

  return (
    <div className="portal-card">
      <div className="portal-card__brand">YK Online s.r.o.</div>
      <h1>Client portal</h1>
      <p>
        Sign in to access project materials, handover documents and support for
        your order.
      </p>

      <form className="portal-card__form" onSubmit={handleSubmit}>
        <label>
          E-mail
          <input
            type="email"
            name="email"
            placeholder="name@company.com"
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="btn btn--primary btn--full">
          Sign in
        </button>
      </form>

      <div className="portal-card__setup">
        Password setup link is sent to the billing e-mail after payment
        confirmation.
      </div>

      {message && <div className="portal-card__message">{message}</div>}
    </div>
  );
}
