import { getEnv } from "./env";
import { log } from "./logger";
import { gpAuthHeaders, gpBaseUrl } from "./gp-auth";
import type { CreatePaymentInput, CreatePaymentResult, FinalStatus } from "./types";

/** Convert major-unit amount (e.g. 12.34) to minor units (1234). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Create a GlobalPayments hosted payment link.
 * Endpoint: POST /ucp/links. Return/cancel/status URLs always point at BBB.EU.
 */
export async function gpCreatePayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const env = getEnv();
  const headers = await gpAuthHeaders();

  const amountMinor = toMinorUnits(input.amount);
  const currency = input.currency.toUpperCase();

  const body: Record<string, unknown> = {
    account_name: env.GP_ACCOUNT_NAME || undefined,
    type: "PAYMENT",
    usage_mode: "SINGLE",
    usage_limit: "1",
    reference: input.orderId,
    name: input.customerName || `Order ${input.orderId}`,
    description: input.customerTrns || `Order ${input.orderId}`,
    shippable: "NO",
    expiration_date: undefined,
    images: undefined,
    transactions: {
      amount: String(amountMinor),
      currency,
      allowed_payment_methods: ["CARD"],
    },
    notifications: {
      return_url: `${env.SELF_URL}/web2/gp-success`,
      cancel_url: `${env.SELF_URL}/web2/gp-fail`,
      status_url: `${env.SELF_URL}/api/gp-webhook?token=${encodeURIComponent(
        env.GP_WEBHOOK_TOKEN
      )}`,
    },
  };

  // Strip undefined keys for a clean payload.
  const payload = JSON.parse(JSON.stringify(body));

  log.info("gp.create_link.start", {
    orderId: input.orderId,
    amount: amountMinor,
    currency,
  });

  const res = await fetch(`${gpBaseUrl()}/ucp/links`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    log.error("gp.create_link.failed", {
      orderId: input.orderId,
      statusCode: res.status,
      body: text.slice(0, 800),
    });
    throw new Error(`GP create link failed: HTTP ${res.status}`);
  }

  let parsed: { id?: string; url?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("GP create link: invalid JSON response");
  }

  if (!parsed.id || !parsed.url) {
    throw new Error("GP create link: missing id/url in response");
  }

  log.info("gp.create_link.success", {
    orderId: input.orderId,
    linkId: parsed.id,
  });

  return {
    provider: "globalpayments",
    checkoutUrl: parsed.url,
    providerRef: parsed.id,
  };
}

/** Defensive extraction of order/transaction status from a GP webhook/body. */
export function gpExtractStatus(payload: Record<string, unknown>): string {
  const direct =
    (payload.status as string) ||
    (payload.transaction_status as string) ||
    ((payload.action as Record<string, unknown>)?.result_code as string);
  return (direct || "").toString().toUpperCase();
}

/** GP success states that mean money has actually been captured. */
const GP_PAID_STATES = new Set(["CAPTURED", "PAID"]);
const GP_FAILED_STATES = new Set([
  "DECLINED",
  "REJECTED",
  "FAILED",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
]);

export function gpIsPaid(status: string): boolean {
  return GP_PAID_STATES.has(status.toUpperCase());
}

export function gpIsFailed(status: string): boolean {
  return GP_FAILED_STATES.has(status.toUpperCase());
}

/**
 * Retrieve the latest known status for a payment link (reconcile path).
 * Returns paid/failed/pending. Best-effort: a non-final response => pending.
 */
export async function gpGetLinkStatus(linkId: string): Promise<{
  status: FinalStatus;
  transactionId?: string;
  amountMinor?: number;
  currency?: string;
  raw: unknown;
}> {
  const headers = await gpAuthHeaders();
  const res = await fetch(`${gpBaseUrl()}/ucp/links/${encodeURIComponent(linkId)}`, {
    method: "GET",
    headers,
  });
  const text = await res.text();
  if (!res.ok) {
    log.warn("gp.retrieve_link.failed", {
      linkId,
      statusCode: res.status,
    });
    return { status: "pending", raw: text.slice(0, 500) };
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "pending", raw: text.slice(0, 500) };
  }

  // GP returns transactions[] under a link; pick the most relevant one.
  const txns = (parsed.transactions as Record<string, unknown>[]) || [];
  const last = txns.length ? txns[txns.length - 1] : undefined;
  const rawStatus = last
    ? gpExtractStatus(last)
    : gpExtractStatus(parsed);

  let status: FinalStatus = "pending";
  if (gpIsPaid(rawStatus)) status = "paid";
  else if (gpIsFailed(rawStatus)) status = "failed";

  return {
    status,
    transactionId: (last?.id as string) || (parsed.id as string) || undefined,
    amountMinor: last?.amount ? Number(last.amount) : undefined,
    currency: (last?.currency as string) || (parsed.currency as string),
    raw: parsed,
  };
}
