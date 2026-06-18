/**
 * Startup environment validation. Fail-fast on missing required vars.
 * All values here are server-side only and must never reach the client bundle.
 */

type Provider = "globalpayments" | "viva";

function required(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === null || v.trim() === "") {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function optional(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v === null ? fallback : v.trim();
}

function asProvider(name: string, value: string): Provider {
  if (value !== "globalpayments" && value !== "viva") {
    throw new Error(
      `[env] ${name} must be 'globalpayments' or 'viva', got: ${value}`
    );
  }
  return value;
}

function buildEnv() {
  const NODE_ENV = optional("NODE_ENV", "production");

  const SELF_URL = required("SELF_URL").replace(/\/+$/, "");
  const SHOP_DOMAIN = required("SHOP_DOMAIN").replace(/\/+$/, "");
  const INTERNAL_API_SECRET = required("INTERNAL_API_SECRET");

  const SHOP_WEBHOOK_URL = required("SHOP_WEBHOOK_URL");
  const SHOP_SUPABASE_ANON_KEY = required("SHOP_SUPABASE_ANON_KEY");

  const PAYMENT_PROVIDER_PRIMARY = asProvider(
    "PAYMENT_PROVIDER_PRIMARY",
    optional("PAYMENT_PROVIDER_PRIMARY", "globalpayments")
  );
  const fallbackRaw = optional("PAYMENT_PROVIDER_FALLBACK", "");
  const PAYMENT_PROVIDER_FALLBACK: Provider | null = fallbackRaw
    ? asProvider("PAYMENT_PROVIDER_FALLBACK", fallbackRaw)
    : null;

  // GlobalPayments
  const GP_ENV = optional("GP_ENV", "live");
  const GP_APP_ID = required("GP_APP_ID");
  const GP_APP_KEY = required("GP_APP_KEY");
  const GP_ACCOUNT_NAME = optional("GP_ACCOUNT_NAME", "");
  const GP_API_VERSION = optional("GP_API_VERSION", "2021-03-22");
  const GP_WEBHOOK_TOKEN = required("GP_WEBHOOK_TOKEN");

  // Viva
  const VIVA_ENV = optional("VIVA_ENV", "live");
  const VIVA_CLIENT_ID = required("VIVA_CLIENT_ID");
  const VIVA_CLIENT_SECRET = required("VIVA_CLIENT_SECRET");
  const VIVA_SOURCE_CODE = required("VIVA_SOURCE_CODE");
  const VIVA_WEBHOOK_KEY = required("VIVA_WEBHOOK_KEY");

  const DATABASE_URL = required("DATABASE_URL");
  const CRON_SECRET = optional("CRON_SECRET", "");

  return {
    NODE_ENV,
    SELF_URL,
    SHOP_DOMAIN,
    INTERNAL_API_SECRET,
    SHOP_WEBHOOK_URL,
    SHOP_SUPABASE_ANON_KEY,
    PAYMENT_PROVIDER_PRIMARY,
    PAYMENT_PROVIDER_FALLBACK,
    GP_ENV,
    GP_APP_ID,
    GP_APP_KEY,
    GP_ACCOUNT_NAME,
    GP_API_VERSION,
    GP_WEBHOOK_TOKEN,
    VIVA_ENV,
    VIVA_CLIENT_ID,
    VIVA_CLIENT_SECRET,
    VIVA_SOURCE_CODE,
    VIVA_WEBHOOK_KEY,
    DATABASE_URL,
    CRON_SECRET,
    isGpLive: GP_ENV.toLowerCase() === "live",
    isVivaLive: VIVA_ENV.toLowerCase() === "live",
  } as const;
}

export type Env = ReturnType<typeof buildEnv>;
export type { Provider };

let cached: Env | null = null;

/**
 * Lazily validate + cache env. Throws on first access if config is incomplete.
 * Use inside route handlers / lib functions (Node runtime) so build does not
 * fail when env is intentionally absent.
 */
export function getEnv(): Env {
  if (cached) return cached;
  cached = buildEnv();
  return cached;
}
