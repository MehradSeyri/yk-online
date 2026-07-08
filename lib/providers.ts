import { getEnv } from "./env";
import { log } from "./logger";
import { gpCreatePayment } from "./gp";
import { comgateCreatePayment } from "./comgate";
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
  if (provider === "comgate") return comgateCreatePayment(input);
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

  const effectivePrimary = primary === "globalpayments" ? fallback : primary;
  const effectiveFallback = fallback === "globalpayments" ? null : fallback;

  if (!effectivePrimary) {
    throw new Error(
      "GlobalPayments is currently disabled. Set PAYMENT_PROVIDER_PRIMARY to 'viva' or 'comgate' and remove 'globalpayments' from fallback."
    );
  }

  try {
    const result = await createWith(effectivePrimary, input);
    log.info("provider.primary_ok", {
      orderId: input.orderId,
      provider: effectivePrimary,
      originalPrimary: primary,
    });
    if (primary === "globalpayments") {
      log.warn("provider.globalpayments_disabled", {
        orderId: input.orderId,
        skippedPrimary: primary,
        used: effectivePrimary,
      });
    }
    return result;
  } catch (primaryErr) {
    const reason =
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    log.warn("provider.primary_failed", {
      orderId: input.orderId,
      provider: effectivePrimary,
      originalPrimary: primary,
      reason,
    });

    if (!effectiveFallback || effectiveFallback === effectivePrimary) {
      log.error("provider.no_fallback", {
        orderId: input.orderId,
        provider: effectivePrimary,
      });
      throw primaryErr;
    }

    try {
      const result = await createWith(effectiveFallback, input);
      log.info("provider.fallback_used", {
        orderId: input.orderId,
        from: effectivePrimary,
        to: effectiveFallback,
        originalPrimary: primary,
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
        from: effectivePrimary,
        to: effectiveFallback,
        originalPrimary: primary,
        primaryReason: reason,
        fallbackReason: fbReason,
      });
      throw fallbackErr;
    }
  }
}
