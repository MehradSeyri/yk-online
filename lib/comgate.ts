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

const BASE_URL = "https://payments.comgate.cz/v2.0";

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

function asBool(v: boolean): boolean {
  return v;
}

function shortLabel(input: CreatePaymentInput): string {
  const raw = input.customerTrns || `Order ${input.orderId}`;
  return raw.slice(0, 16);
}

function normalizeCurrency(curr: string): string {
  return curr.trim().toUpperCase();
}

function basicAuth(merchant: string, secret: string): string {
  return `Basic ${Buffer.from(`${merchant}:${secret}`, "utf8").toString("base64")}`;
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
  const auth = basicAuth(env.COMGATE_MERCHANT, env.COMGATE_SECRET);

  const payload: Record<string, unknown> = {
    test: asBool(!env.isComgateLive),
    price: toMinorUnits(input.amount),
    curr: normalizeCurrency(input.currency),
    label: shortLabel(input),
    refId: input.orderId,
    method: env.COMGATE_METHOD || "ALL",
    lang: normalizeLang(input.lang),
    delivery: "ELECTRONIC_DELIVERY",
    category: "OTHER",
    url_paid: `${env.SELF_URL}/web2/comgate-success?transId=${"${id}"}&refId=${"${refId}"}`,
    url_cancelled: `${env.SELF_URL}/web2/comgate-fail?transId=${"${id}"}&refId=${"${refId}"}`,
    url_pending: `${env.SELF_URL}/web2/comgate-pending?transId=${"${id}"}&refId=${"${refId}"}`,
  };

  // Keep push URL explicitly aligned to BBB endpoint for each payment.
  payload.url_push = `${env.SELF_URL}/api/comgate-webhook`;

  if (input.customerEmail?.trim()) payload.email = input.customerEmail.trim();
  if (input.customerPhone?.trim()) payload.phone = input.customerPhone.trim();
  if (input.customerName?.trim()) payload.fullName = input.customerName.trim();

  // Comgate requires at least one contact value; prefer e-mail for better UX.
  if (!payload.email && !payload.phone) {
    payload.email = "info@yk-online.eu";
  }

  log.info("comgate.create.start", {
    orderId: input.orderId,
    price: payload.price,
    currency: payload.curr,
    test: asBoolString(!env.isComgateLive),
  });

  const res = await fetch(`${BASE_URL}/payment.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    parsed = parseForm(text);
  }

  if (!res.ok) {
    log.error("comgate.create.http_failed", {
      statusCode: res.status,
      body: text.slice(0, 500),
      orderId: input.orderId,
    });
    throw new Error(`Comgate create failed: HTTP ${res.status}`);
  }

  if (String(parsed.code ?? "") !== "0") {
    log.error("comgate.create.api_failed", {
      orderId: input.orderId,
      code: parsed.code,
      message: parsed.message,
      body: text.slice(0, 500),
    });
    throw new Error(`Comgate create failed: ${String(parsed.code ?? "unknown")}`);
  }

  const transId = typeof parsed.transId === "string" ? parsed.transId : "";
  const redirect = typeof parsed.redirect === "string" ? parsed.redirect : "";

  if (!transId || !redirect) {
    throw new Error("Comgate create failed: missing transId/redirect");
  }

  log.info("comgate.create.success", {
    orderId: input.orderId,
    transId,
  });

  return {
    provider: "comgate",
    checkoutUrl: redirect,
    providerRef: transId,
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
  const auth = basicAuth(env.COMGATE_MERCHANT, env.COMGATE_SECRET);

  const res = await fetch(`${BASE_URL}/payment/transId/${encodeURIComponent(transId)}.json`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: auth,
    },
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

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    parsed = parseForm(text);
  }

  if (String(parsed.code ?? "") !== "0") {
    log.warn("comgate.status.api_failed", {
      transId,
      code: parsed.code,
      message: parsed.message,
    });
    return { status: "pending", raw: parsed };
  }

  const remoteStatus = String(parsed.status ?? "").toUpperCase();
  let status: FinalStatus = "pending";
  if (isPaidStatus(remoteStatus)) status = "paid";
  else if (isFailedStatus(remoteStatus)) status = "failed";

  const amountMinor = parsed.price !== undefined ? Number(parsed.price) : undefined;

  return {
    status,
    transactionId:
      typeof parsed.transId === "string" && parsed.transId ? parsed.transId : transId,
    amountMinor: Number.isFinite(amountMinor as number) ? amountMinor : undefined,
    currency: typeof parsed.curr === "string" ? parsed.curr : undefined,
    orderId: typeof parsed.refId === "string" ? parsed.refId : undefined,
    email: typeof parsed.email === "string" ? parsed.email : undefined,
    fullName:
      typeof parsed.payerName === "string"
        ? parsed.payerName
        : typeof parsed.fullName === "string"
          ? parsed.fullName
          : undefined,
    raw: parsed,
  };
}
