/**
 * Startup environment validation. Fail-fast on missing required vars.
 * All values here are server-side only and must never reach the client bundle.
 */

type Provider = "globalpayments" | "viva" | "comgate";

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
  if (value !== "globalpayments" && value !== "viva" && value !== "comgate") {
    throw new Error(
      `[env] ${name} must be 'globalpayments', 'viva' or 'comgate', got: ${value}`
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
    optional("PAYMENT_PROVIDER_PRIMARY", "comgate")
  );
  const fallbackRaw = optional("PAYMENT_PROVIDER_FALLBACK", "");
  const PAYMENT_PROVIDER_FALLBACK: Provider | null = fallbackRaw
    ? asProvider("PAYMENT_PROVIDER_FALLBACK", fallbackRaw)
    : null;

  const providerInUse = (provider: Provider) =>
    provider !== "globalpayments" &&
    (PAYMENT_PROVIDER_PRIMARY === provider || PAYMENT_PROVIDER_FALLBACK === provider);

  // GlobalPayments is temporarily disabled in code. Do not require GP credentials.
  const GP_ENV = optional("GP_ENV", "live");
  const GP_APP_ID = providerInUse("globalpayments")
    ? required("GP_APP_ID")
    : optional("GP_APP_ID", "");
  const GP_APP_KEY = providerInUse("globalpayments")
    ? required("GP_APP_KEY")
    : optional("GP_APP_KEY", "");
  const GP_ACCOUNT_NAME = optional("GP_ACCOUNT_NAME", "");
  const GP_API_VERSION = optional("GP_API_VERSION", "2021-03-22");
  const GP_WEBHOOK_TOKEN = providerInUse("globalpayments")
    ? required("GP_WEBHOOK_TOKEN")
    : optional("GP_WEBHOOK_TOKEN", "");

  // Comgate
  const COMGATE_ENV = optional("COMGATE_ENV", "live");
  const COMGATE_MERCHANT = providerInUse("comgate")
    ? required("COMGATE_MERCHANT")
    : optional("COMGATE_MERCHANT", "");
  const COMGATE_SECRET = providerInUse("comgate")
    ? required("COMGATE_SECRET")
    : optional("COMGATE_SECRET", "");
  const COMGATE_METHOD = optional("COMGATE_METHOD", "ALL");

  // Viva
  const VIVA_ENV = optional("VIVA_ENV", "live");
  const VIVA_CLIENT_ID = providerInUse("viva")
    ? required("VIVA_CLIENT_ID")
    : optional("VIVA_CLIENT_ID", "");
  const VIVA_CLIENT_SECRET = providerInUse("viva")
    ? required("VIVA_CLIENT_SECRET")
    : optional("VIVA_CLIENT_SECRET", "");
  const VIVA_SOURCE_CODE = providerInUse("viva")
    ? required("VIVA_SOURCE_CODE")
    : optional("VIVA_SOURCE_CODE", "");
  const VIVA_WEBHOOK_KEY = providerInUse("viva")
    ? required("VIVA_WEBHOOK_KEY")
    : optional("VIVA_WEBHOOK_KEY", "");
  // Legacy merchant API credentials (Basic auth) are optional and only used
  // for order status lookups. Create-order can work without them.
  const VIVA_MERCHANT_ID = optional("VIVA_MERCHANT_ID", "");
  const VIVA_API_KEY = optional("VIVA_API_KEY", "");

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
    COMGATE_ENV,
    COMGATE_MERCHANT,
    COMGATE_SECRET,
    COMGATE_METHOD,
    VIVA_ENV,
    VIVA_CLIENT_ID,
    VIVA_CLIENT_SECRET,
    VIVA_SOURCE_CODE,
    VIVA_WEBHOOK_KEY,
    VIVA_MERCHANT_ID,
    VIVA_API_KEY,
    DATABASE_URL,
    CRON_SECRET,
    isGpLive: GP_ENV.toLowerCase() === "live",
    isComgateLive: COMGATE_ENV.toLowerCase() === "live",
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
