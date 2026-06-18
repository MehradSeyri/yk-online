import { createHash } from "crypto";
import { getEnv } from "./env";
import { log } from "./logger";

const SANDBOX_BASE = "https://apis.sandbox.globalpay.com";
const LIVE_BASE = "https://apis.globalpay.com";

export function gpBaseUrl(): string {
  return getEnv().isGpLive ? LIVE_BASE : SANDBOX_BASE;
}

interface TokenCache {
  token: string;
  expiresAt: number; // epoch ms
}

let cache: TokenCache | null = null;

/**
 * GlobalPayments access token (GP-API).
 * secret = SHA512(nonce + APP_KEY) hex. Token cached until expiry minus 60s.
 */
export async function getGpAccessToken(): Promise<string> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.token;
  }

  const env = getEnv();
  const nonce = new Date().toISOString();
  const secret = createHash("sha512")
    .update(nonce + env.GP_APP_KEY)
    .digest("hex");

  const res = await fetch(`${gpBaseUrl()}/ucp/accesstoken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-GP-Version": env.GP_API_VERSION,
      Accept: "application/json",
    },
    body: JSON.stringify({
      app_id: env.GP_APP_ID,
      nonce,
      secret,
      grant_type: "client_credentials",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    log.error("gp.accesstoken_failed", {
      statusCode: res.status,
      body: text.slice(0, 500),
    });
    throw new Error(`GP accesstoken failed: HTTP ${res.status}`);
  }

  let parsed: { token?: string; seconds_to_expire?: number };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("GP accesstoken: invalid JSON response");
  }

  if (!parsed.token) {
    throw new Error("GP accesstoken: missing token in response");
  }

  const secondsToExpire = parsed.seconds_to_expire ?? 1800;
  cache = {
    token: parsed.token,
    expiresAt: now + Math.max(secondsToExpire - 60, 30) * 1000,
  };
  log.info("gp.accesstoken_ok", { secondsToExpire });
  return cache.token;
}

/** Common headers for authenticated GP-API calls. */
export async function gpAuthHeaders(): Promise<Record<string, string>> {
  const env = getEnv();
  const token = await getGpAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "X-GP-Version": env.GP_API_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}
