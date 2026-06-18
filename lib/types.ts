import type { Provider } from "./env";

export type { Provider };

/** Input accepted by the provider router / create-order endpoint. */
export interface CreatePaymentInput {
  orderId: string;
  /** Amount in major units as received from AAA.CZ (e.g. 12.34). */
  amount: number;
  /** ISO alpha-3 currency, e.g. EUR / CZK. */
  currency: string;
  countryCode?: string;
  lang?: string;
  customerTrns?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}

/** Normalized output every provider must return. */
export interface CreatePaymentResult {
  provider: Provider;
  checkoutUrl: string;
  providerRef: string;
}

/** Canonical payload forwarded to AAA.CZ payment-webhook. */
export interface ShopWebhookPayload {
  provider: Provider;
  orderId: string;
  status: "paid";
  transactionId: string;
  providerRef: string;
  amount: number; // minor units (cents)
  currency: string;
  email: string;
  fullName: string;
}

/** Outcome of querying a provider for final status (used by reconcile). */
export type FinalStatus = "paid" | "failed" | "pending";
