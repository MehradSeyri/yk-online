import { getEnv } from "./env";
import { log } from "./logger";
import { normalizeLang } from "./lang";
import {
  getVivaAccessToken,
  vivaApiUrl,
  vivaCheckoutUrl,
} from "./viva-auth";
import { toMinorUnits } from "./gp";
import { alphaToNumeric, numericToAlpha } from "./currency";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  FinalStatus,
} from "./types";

/**
 * Create a Viva smart-checkout order.
 * Endpoint: POST /checkout/v2/orders. merchantTrns = orderId.
 */
export async function vivaCreatePayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const env = getEnv();
  const token = await getVivaAccessToken();

  const amountMinor = toMinorUnits(input.amount);
  const requestLang = normalizeLang(input.requestLang ?? input.lang);

  const body: Record<string, unknown> = {
    amount: amountMinor,
    customerTrns: input.customerTrns || `Order ${input.orderId}`,
    customer: {
      email: input.customerEmail || undefined,
      fullName: input.customerName || undefined,
      phone: input.customerPhone || undefined,
      countryCode: input.countryCode || undefined,
    },
    requestLang,
    paymentTimeout: 1800,
    preauth: false,
    allowRecurring: false,
    maxInstallments: 0,
    paymentNotification: true,
    disableExactAmount: false,
    disableCash: true,
    disableWallet: false,
    sourceCode: env.VIVA_SOURCE_CODE,
    merchantTrns: input.orderId,
    // Allow explicit numeric currency code from the frontend (preferred
    // for Viva) and otherwise derive from alpha-3 currency string.
    currencyCode:
      input.currencyCode !== undefined
        ? input.currencyCode
        : alphaToNumeric(input.currency) ?? 978,
  };

  const payload = JSON.parse(JSON.stringify(body));

  log.info("viva.create_order.start", {
    orderId: input.orderId,
    amount: amountMinor,
    currency: input.currency,
  });

  const createBase = getEnv().isVivaLive
    ? "https://www.vivapayments.com"
    : "https://demo.vivapayments.com";
  const res = await fetch(`${createBase}/checkout/v2/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    log.error("viva.create_order.failed", {
      orderId: input.orderId,
      statusCode: res.status,
      body: text.slice(0, 800),
    });
    throw new Error(`Viva create order failed: HTTP ${res.status}`);
  }

  let parsed: { orderCode?: number | string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Viva create order: invalid JSON response");
  }

  if (parsed.orderCode === undefined || parsed.orderCode === null) {
    throw new Error("Viva create order: missing orderCode");
  }

  const orderCode = String(parsed.orderCode);
  log.info("viva.create_order.success", {
    orderId: input.orderId,
    orderCode,
  });

  return {
    provider: "viva",
    checkoutUrl: vivaCheckoutUrl(orderCode),
    providerRef: orderCode,
  };
}

/**
 * Viva ISO 4217 numeric currency code (the v2 orders API expects numeric).
 * Defaults to EUR (978) if unknown.
 */
/** Reverse of currencyToIsoNumeric: Viva ISO-numeric -> alpha-3. */
export function currencyToIsoNumeric(currency: string): number {
  return alphaToNumeric(currency) ?? 978;
}

// --- Viva webhook event semantics ---------------------------------------

/** Strict paid condition for Viva: EventTypeId 1796 (payment created) + StatusId 'F' (finished). */
export const VIVA_EVENT_PAYMENT_CREATED = 1796;
export const VIVA_STATUS_FINISHED = "F";

function getVivaApiBasicAuthHeader(): string {
  const env = getEnv();
  const encoded = Buffer.from(
    `${env.VIVA_MERCHANT_ID}:${env.VIVA_API_KEY}`
  ).toString("base64");
  return `Basic ${encoded}`;
}

export function vivaIsPaid(
  eventTypeId: number | null | undefined,
  statusId: string | null | undefined
): boolean {
  return (
    eventTypeId === VIVA_EVENT_PAYMENT_CREATED &&
    (statusId || "").toUpperCase() === VIVA_STATUS_FINISHED
  );
}

/**
 * Retrieve transactions for a Viva order (reconcile path).
 * GET /orders/{orderCode} — returns the order with a StateId.
 * Best-effort state mapping based on Viva order state IDs.
 */
export async function vivaGetOrderStatus(orderCode: string): Promise<{
  status: FinalStatus;
  transactionId?: string;
  amountMinor?: number;
  currency?: string;
  raw: unknown;
}> {
  const env = getEnv();

  // Prefer merchant Basic-auth (MerchantID:APIKey) for order lookups if available.
  if (env.VIVA_MERCHANT_ID && env.VIVA_API_KEY) {
    try {
      const isLive = env.isVivaLive;
      const merchantApiBase = isLive
        ? "https://www.vivapayments.com"
        : "https://demo.vivapayments.com";
      const basic = Buffer.from(`${env.VIVA_MERCHANT_ID}:${env.VIVA_API_KEY}`).toString("base64");
      log.info("viva.retrieve_order.call_merchant_api", { orderCode });
      const res = await fetch(`${merchantApiBase}/api/orders/${encodeURIComponent(orderCode)}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/json",
        },
      });
      const text = await res.text();
      if (!res.ok) {
        log.warn("viva.retrieve_order.failed", {
          orderCode,
          statusCode: res.status,
          body: text.slice(0, 1000),
          auth: "merchant_basic",
        });
        return { status: "pending", raw: text.slice(0, 1000) };
      }
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const stateId = Number(parsed.StateId ?? parsed.stateId ?? -1);
        let status: FinalStatus = "pending";
        if (stateId === 3) status = "paid";
        else if (stateId === 1 || stateId === 2) status = "failed";
        const currencyNumeric = parsed.CurrencyCode !== undefined ? String(parsed.CurrencyCode) : "";
        const currency = numericToAlpha(currencyNumeric) || undefined;
        return {
          status,
          transactionId: (parsed.TransactionId as string) || (parsed.transactionId as string) || undefined,
          amountMinor: parsed.Amount !== undefined ? Math.round(Number(parsed.Amount) * 100) : undefined,
          currency,
          raw: parsed,
        };
      } catch (err) {
        log.warn("viva.retrieve_order.parse_failed", { orderCode, err: String(err) });
        return { status: "pending", raw: text.slice(0, 1000) };
      }
    } catch (err) {
      log.warn("viva.retrieve_order.error", { orderCode, err: String(err) });
      return { status: "pending", raw: String(err) };
    }
  }

  // Fallback: OAuth2 access token (Smart Checkout client) path.
  const token = await getVivaAccessToken();
  const res = await fetch(`${vivaApiUrl()}/orders/${encodeURIComponent(orderCode)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    log.warn("viva.retrieve_order.failed", {
      orderCode,
      statusCode: res.status,
      body: text.slice(0, 500),
      auth: "oauth",
    });
    return { status: "pending", raw: text.slice(0, 500) };
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "pending", raw: text.slice(0, 500) };
  }

  // StateId: 0 Pending, 1 Expired, 2 Canceled, 3 Paid (per Viva order states).
  const stateId = Number(parsed.StateId ?? parsed.stateId ?? -1);
  let status: FinalStatus = "pending";
  if (stateId === 3) status = "paid";
  else if (stateId === 1 || stateId === 2) status = "failed";

  const currencyNumeric =
    parsed.CurrencyCode !== undefined ? String(parsed.CurrencyCode) : "";
  const currency = numericToAlpha(currencyNumeric) || undefined;

  return {
    status,
    transactionId:
      (parsed.TransactionId as string) ||
      (parsed.transactionId as string) ||
      undefined,
    amountMinor:
      parsed.Amount !== undefined
        ? Math.round(Number(parsed.Amount) * 100)
        : undefined,
    currency,
    raw: parsed,
  };
}
