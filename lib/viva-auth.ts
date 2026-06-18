import { getEnv } from "./env";
import { log } from "./logger";

// OAuth2 token endpoint (accounts host).
const LIVE_ACCOUNTS = "https://accounts.vivapayments.com";
const DEMO_ACCOUNTS = "https://demo-accounts.vivapayments.com";

// REST API host (orders, transactions).
const LIVE_API = "https://api.vivapayments.com";
const DEMO_API = "https://demo-api.vivapayments.com";

// Hosted checkout host (smart checkout redirect).
const LIVE_CHECKOUT = "https://www.vivapayments.com";
const DEMO_CHECKOUT = "https://demo.vivapayments.com";

export function vivaAccountsUrl(): string {
  return getEnv().isVivaLive ? LIVE_ACCOUNTS : DEMO_ACCOUNTS;
}
export function vivaApiUrl(): string {
  return getEnv().isVivaLive ? LIVE_API : DEMO_API;
}
export function vivaCheckoutUrl(orderCode: string): string {
  const base = getEnv().isVivaLive ? LIVE_CHECKOUT : DEMO_CHECKOUT;
  return `${base}/web2?ref=${encodeURIComponent(orderCode)}`;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

/** Viva OAuth2 client-credentials access token, cached until expiry minus 60s. */
export async function getVivaAccessToken(): Promise<string> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.token;
  }

  const env = getEnv();
  const basic = Buffer.from(
    `${env.VIVA_CLIENT_ID}:${env.VIVA_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${vivaAccountsUrl()}/connect/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    log.error("viva.token_failed", {
      statusCode: res.status,
      body: text.slice(0, 500),
    });
    throw new Error(`Viva token failed: HTTP ${res.status}`);
  }

  let parsed: { access_token?: string; expires_in?: number };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Viva token: invalid JSON response");
  }
  if (!parsed.access_token) {
    throw new Error("Viva token: missing access_token");
  }

  const expiresIn = parsed.expires_in ?? 3600;
  cache = {
    token: parsed.access_token,
    expiresAt: now + Math.max(expiresIn - 60, 30) * 1000,
  };
  log.info("viva.token_ok", { expiresIn });
  return cache.token;
}
