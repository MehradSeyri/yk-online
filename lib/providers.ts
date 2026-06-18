import { getEnv } from "./env";
import { log } from "./logger";
import { gpCreatePayment } from "./gp";
import { vivaCreatePayment } from "./viva";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  Provider,
} from "./types";

function createWith(
  provider: Provider,
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  if (provider === "globalpayments") return gpCreatePayment(input);
  return vivaCreatePayment(input);
}

/**
 * Create a payment via the configured PRIMARY provider; on a creation failure
 * automatically retry via FALLBACK (if defined and different). Fallback applies
 * ONLY to link/order creation — never after the customer has paid, so there is
 * no risk of a double charge.
 */
export async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const env = getEnv();
  const primary = env.PAYMENT_PROVIDER_PRIMARY;
  const fallback = env.PAYMENT_PROVIDER_FALLBACK;

  try {
    const result = await createWith(primary, input);
    log.info("provider.primary_ok", {
      orderId: input.orderId,
      provider: primary,
    });
    return result;
  } catch (primaryErr) {
    const reason =
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    log.warn("provider.primary_failed", {
      orderId: input.orderId,
      provider: primary,
      reason,
    });

    if (!fallback || fallback === primary) {
      log.error("provider.no_fallback", {
        orderId: input.orderId,
        provider: primary,
      });
      throw primaryErr;
    }

    try {
      const result = await createWith(fallback, input);
      log.info("provider.fallback_used", {
        orderId: input.orderId,
        from: primary,
        to: fallback,
        primaryReason: reason,
      });
      return result;
    } catch (fallbackErr) {
      const fbReason =
        fallbackErr instanceof Error
          ? fallbackErr.message
          : String(fallbackErr);
      log.error("provider.fallback_failed", {
        orderId: input.orderId,
        from: primary,
        to: fallback,
        primaryReason: reason,
        fallbackReason: fbReason,
      });
      throw fallbackErr;
    }
  }
}
