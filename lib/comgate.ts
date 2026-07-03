import { getEnv } from "./env";
import { log } from "./logger";
import { normalizeLang } from "./lang";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  FinalStatus,
} from "./types";

function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

const BASE_URL = "https://payments.comgate.cz/v1.0";

function parseForm(text: string): Record<string, string> {
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    out[key] = value;
  }
  return out;
}

function asBoolString(v: boolean): string {
  return v ? "true" : "false";
}

function shortLabel(input: CreatePaymentInput): string {
  const raw = input.customerTrns || `Order ${input.orderId}`;
  return raw.slice(0, 16);
}

function normalizeCurrency(curr: string): string {
  return curr.trim().toUpperCase();
}

function isPaidStatus(status: string): boolean {
  return status.toUpperCase() === "PAID";
}

function isFailedStatus(status: string): boolean {
  return status.toUpperCase() === "CANCELLED";
}

export async function comgateCreatePayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const env = getEnv();

  const payload = new URLSearchParams({
    merchant: env.COMGATE_MERCHANT,
    test: asBoolString(!env.isComgateLive),
    price: String(toMinorUnits(input.amount)),
    curr: normalizeCurrency(input.currency),
    label: shortLabel(input),
    refId: input.orderId,
    method: env.COMGATE_METHOD || "ALL",
    prepareOnly: "true",
    secret: env.COMGATE_SECRET,
    lang: normalizeLang(input.lang),
    delivery: "ELECTRONIC_DELIVERY",
    category: "OTHER",
    url_paid: `${env.SELF_URL}/web2/comgate-success?transId=${"${id}"}&refId=${"${refId}"}`,
    url_cancelled: `${env.SELF_URL}/web2/comgate-fail?transId=${"${id}"}&refId=${"${refId}"}`,
    url_pending: `${env.SELF_URL}/web2/comgate-pending?transId=${"${id}"}&refId=${"${refId}"}`,
    url_push: `${env.SELF_URL}/api/comgate-webhook`,
  });

  if (input.customerEmail?.trim()) payload.set("email", input.customerEmail.trim());
  if (input.customerPhone?.trim()) payload.set("phone", input.customerPhone.trim());
  if (input.customerName?.trim()) payload.set("fullName", input.customerName.trim());

  // Comgate requires at least one contact value; prefer e-mail for better UX.
  if (!payload.get("email") && !payload.get("phone")) {
    payload.set("email", "info@yk-online.eu");
  }

  log.info("comgate.create.start", {
    orderId: input.orderId,
    price: payload.get("price"),
    currency: payload.get("curr"),
    test: payload.get("test"),
  });

  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });

  const text = await res.text();
  const parsed = parseForm(text);

  if (!res.ok) {
    log.error("comgate.create.http_failed", {
      statusCode: res.status,
      body: text.slice(0, 500),
      orderId: input.orderId,
    });
    throw new Error(`Comgate create failed: HTTP ${res.status}`);
  }

  if (parsed.code !== "0") {
    log.error("comgate.create.api_failed", {
      orderId: input.orderId,
      code: parsed.code,
      message: parsed.message,
      body: text.slice(0, 500),
    });
    throw new Error(`Comgate create failed: ${parsed.code || "unknown"}`);
  }

  if (!parsed.transId || !parsed.redirect) {
    throw new Error("Comgate create failed: missing transId/redirect");
  }

  log.info("comgate.create.success", {
    orderId: input.orderId,
    transId: parsed.transId,
  });

  return {
    provider: "comgate",
    checkoutUrl: parsed.redirect,
    providerRef: parsed.transId,
  };
}

export async function comgateGetStatus(transId: string): Promise<{
  status: FinalStatus;
  transactionId?: string;
  amountMinor?: number;
  currency?: string;
  orderId?: string;
  email?: string;
  fullName?: string;
  raw: unknown;
}> {
  const env = getEnv();

  const payload = new URLSearchParams({
    merchant: env.COMGATE_MERCHANT,
    transId,
    secret: env.COMGATE_SECRET,
  });

  const res = await fetch(`${BASE_URL}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    log.warn("comgate.status.http_failed", {
      transId,
      statusCode: res.status,
      body: text.slice(0, 300),
    });
    return { status: "pending", raw: text.slice(0, 500) };
  }

  const parsed = parseForm(text);
  if (parsed.code !== "0") {
    log.warn("comgate.status.api_failed", {
      transId,
      code: parsed.code,
      message: parsed.message,
    });
    return { status: "pending", raw: parsed };
  }

  const remoteStatus = (parsed.status || "").toUpperCase();
  let status: FinalStatus = "pending";
  if (isPaidStatus(remoteStatus)) status = "paid";
  else if (isFailedStatus(remoteStatus)) status = "failed";

  const amountMinor = parsed.price ? Number(parsed.price) : undefined;

  return {
    status,
    transactionId: parsed.transId || transId,
    amountMinor: Number.isFinite(amountMinor as number) ? amountMinor : undefined,
    currency: parsed.curr,
    orderId: parsed.refId,
    email: parsed.email,
    fullName: parsed.payerName || parsed.fullName,
    raw: parsed,
  };
}
