import { getEnv } from "./env";
import { log } from "./logger";
import type { ShopWebhookPayload } from "./types";

/**
 * Forward a final `paid` event to the AAA.CZ Supabase Edge Function.
 * Returns true only on a 2xx from the shop. Caller maps `false` to a 5xx so
 * the provider retries the webhook (at-least-once delivery).
 */
export async function forwardToShop(
  payload: ShopWebhookPayload
): Promise<boolean> {
  const env = getEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(env.SHOP_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SHOP_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SHOP_SUPABASE_ANON_KEY}`,
        "x-internal-secret": env.INTERNAL_API_SECRET,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const ok = res.status >= 200 && res.status < 300;
    log.info("webhook.forwarded", {
      provider: payload.provider,
      orderId: payload.orderId,
      status: payload.status,
      forwardStatusCode: res.status,
      ok,
    });
    if (!ok) {
      const text = await res.text().catch(() => "");
      log.warn("webhook.forward_non_2xx", {
        orderId: payload.orderId,
        forwardStatusCode: res.status,
        body: text.slice(0, 500),
      });
    }
    return ok;
  } catch (err) {
    log.error("webhook.forward_error", {
      orderId: payload.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
