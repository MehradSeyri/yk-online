import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { log } from "./logger";
import { forwardToShop } from "./forward";
import type { Provider, ShopWebhookPayload } from "./types";

/**
 * Record an idempotency key. Returns false if this exact provider event was
 * already seen (UNIQUE conflict) — caller should short-circuit with 200 OK.
 */
export async function recordIdempotency(args: {
  provider: Provider;
  idempotencyKey: string;
  orderId?: string | null;
  transactionId?: string | null;
  eventType?: string | null;
  payload?: unknown;
}): Promise<{ fresh: boolean }> {
  try {
    await prisma.providerWebhookEvent.create({
      data: {
        provider: args.provider,
        idempotencyKey: args.idempotencyKey,
        orderId: args.orderId ?? null,
        transactionId: args.transactionId ?? null,
        eventType: args.eventType ?? null,
        payload: (args.payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
    return { fresh: true };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      log.info("webhook.duplicate", {
        provider: args.provider,
        idempotencyKey: args.idempotencyKey,
      });
      return { fresh: false };
    }
    throw err;
  }
}

/** Persist a metric row into payment_events. */
export async function recordMetric(args: {
  provider: Provider;
  orderId: string;
  status: "initiated" | "success" | "failed" | "confirmed";
  orderCode?: string | null;
  transactionId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  countryCode?: string | null;
  lang?: string | null;
  eventId?: string | null;
  rawPayload?: unknown;
}): Promise<void> {
  await prisma.paymentEvent.create({
    data: {
      provider: args.provider,
      orderId: args.orderId,
      orderCode: args.orderCode ?? null,
      transactionId: args.transactionId ?? null,
      status: args.status,
      amountCents: args.amountCents ?? null,
      currency: args.currency ?? null,
      countryCode: args.countryCode ?? null,
      lang: args.lang ?? null,
      eventId: args.eventId ?? null,
      rawPayload: (args.rawPayload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Whether a `confirmed` event already exists for this order — used to avoid
 * re-forwarding a paid status (monotonic: paid never reverts).
 */
export async function alreadyConfirmed(orderId: string): Promise<boolean> {
  const existing = await prisma.paymentEvent.findFirst({
    where: { orderId, status: "confirmed" },
    select: { id: true },
  });
  return existing !== null;
}

/**
 * Confirm + forward a paid event to AAA.CZ. Returns whether the forward
 * succeeded. On failure the caller must return 5xx so the provider retries.
 */
export async function confirmAndForward(
  payload: ShopWebhookPayload
): Promise<boolean> {
  await recordMetric({
    provider: payload.provider,
    orderId: payload.orderId,
    status: "confirmed",
    transactionId: payload.transactionId,
    orderCode: payload.providerRef,
    amountCents: payload.amount,
    currency: payload.currency,
    rawPayload: payload as unknown,
  });
  return forwardToShop(payload);
}
