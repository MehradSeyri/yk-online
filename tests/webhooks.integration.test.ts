import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("webhooks integration", () => {
  it("retries GP duplicate paid event when order is still unconfirmed", async () => {
    const recordIdempotency = vi.fn().mockResolvedValue({ fresh: false });
    const alreadyConfirmed = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    const confirmAndForward = vi.fn().mockResolvedValue(true);

    vi.doMock("@/lib/env", () => ({
      getEnv: () => ({ GP_WEBHOOK_TOKEN: "gp-token" }),
    }));
    vi.doMock("@/lib/logger", () => ({
      log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("@/lib/webhook-core", () => ({
      recordIdempotency,
      recordMetric: vi.fn(),
      alreadyConfirmed,
      confirmAndForward,
      confirmLocalOnly: vi.fn(),
      isLocalDirectOrder: vi.fn().mockReturnValue(false),
    }));

    const route = await import("@/app/api/gp-webhook/route");

    const req = new NextRequest(
      "https://yk-online.eu/api/gp-webhook?token=gp-token",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reference: "ORDER-1",
          id: "tx-1",
          link_id: "link-1",
          amount: "1234",
          currency: "EUR",
          status: "CAPTURED",
        }),
      }
    );

    const res = await route.POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(confirmAndForward).toHaveBeenCalledTimes(1);
    expect(alreadyConfirmed).toHaveBeenCalled();
  });

  it("ignores Viva paid webhook when provider revalidation is not paid", async () => {
    const confirmAndForward = vi.fn().mockResolvedValue(true);

    vi.doMock("@/lib/env", () => ({
      getEnv: () => ({ VIVA_WEBHOOK_KEY: "viva-key" }),
    }));
    vi.doMock("@/lib/logger", () => ({
      log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("@/lib/viva", () => ({
      vivaIsPaid: vi.fn().mockReturnValue(true),
      vivaGetOrderStatus: vi.fn().mockResolvedValue({
        status: "pending",
        transactionId: "tx-2",
        raw: {},
      }),
    }));
    vi.doMock("@/lib/webhook-core", () => ({
      recordIdempotency: vi.fn().mockResolvedValue({ fresh: true }),
      recordMetric: vi.fn(),
      alreadyConfirmed: vi.fn().mockResolvedValue(false),
      confirmAndForward,
      confirmLocalOnly: vi.fn(),
      isLocalDirectOrder: vi.fn().mockReturnValue(false),
    }));

    const route = await import("@/app/api/viva-webhook/route");

    const req = new NextRequest("https://yk-online.eu/api/viva-webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        EventTypeId: 1796,
        EventData: {
          StatusId: "F",
          MerchantTrns: "ORDER-2",
          OrderCode: "viva-order-2",
          TransactionId: "tx-2",
          Amount: 12.34,
          CurrencyCode: 978,
        },
      }),
    });

    const res = await route.POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ignored).toBe(true);
    expect(body.reason).toBe("revalidation-failed");
    expect(confirmAndForward).not.toHaveBeenCalled();
  });

  it("retries Viva duplicate paid event when still unconfirmed and revalidated", async () => {
    const alreadyConfirmed = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    const confirmAndForward = vi.fn().mockResolvedValue(true);

    vi.doMock("@/lib/env", () => ({
      getEnv: () => ({ VIVA_WEBHOOK_KEY: "viva-key" }),
    }));
    vi.doMock("@/lib/logger", () => ({
      log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("@/lib/viva", () => ({
      vivaIsPaid: vi.fn().mockReturnValue(true),
      vivaGetOrderStatus: vi.fn().mockResolvedValue({
        status: "paid",
        transactionId: "tx-3",
        raw: {},
      }),
    }));
    vi.doMock("@/lib/webhook-core", () => ({
      recordIdempotency: vi.fn().mockResolvedValue({ fresh: false }),
      recordMetric: vi.fn(),
      alreadyConfirmed,
      confirmAndForward,
      confirmLocalOnly: vi.fn(),
      isLocalDirectOrder: vi.fn().mockReturnValue(false),
    }));

    const route = await import("@/app/api/viva-webhook/route");

    const req = new NextRequest("https://yk-online.eu/api/viva-webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        EventTypeId: 1796,
        EventData: {
          StatusId: "F",
          MerchantTrns: "ORDER-3",
          OrderCode: "viva-order-3",
          TransactionId: "tx-3",
          Amount: 12.34,
          CurrencyCode: 978,
        },
      }),
    });

    const res = await route.POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(confirmAndForward).toHaveBeenCalledTimes(1);
    expect(alreadyConfirmed).toHaveBeenCalled();
  });
});
