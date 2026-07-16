import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("create-order provider errors", () => {
  it("returns sanitized Viva providerError for a 403 create-order response", async () => {
    vi.doMock("@/lib/env", () => ({
      getEnv: () => ({
        INTERNAL_API_SECRET: "internal-secret",
        PAYMENT_PROVIDER_PRIMARY: "viva",
        PAYMENT_PROVIDER_FALLBACK: null,
        VIVA_SOURCE_CODE: "7293",
        isVivaLive: true,
      }),
    }));
    vi.doMock("@/lib/viva-auth", () => ({
      getVivaAccessToken: vi.fn().mockResolvedValue("viva-token"),
      vivaApiUrl: () => "https://api.vivapayments.com",
      vivaCheckoutUrl: (orderCode: string) =>
        `https://www.vivapayments.com/web/checkout?ref=${orderCode}`,
    }));
    vi.doMock("@/lib/logger", () => ({
      log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("@/lib/webhook-core", () => ({
      recordMetric: vi.fn(),
    }));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 403,
          message:
            "PaymentsPolicyAcquiringRestriction: Merchant acquiring restricted in 3ds flow",
          eventId: "2108",
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const route = await import("@/app/api/create-order/route");
    const req = new NextRequest("https://yk-online.eu/api/create-order", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": "internal-secret",
      },
      body: JSON.stringify({
        orderId: "ORDER-403",
        amount: 5,
        currency: "CZK",
        currencyCode: 203,
        countryCode: "CZ",
        lang: "cs",
        requestLang: "cs-CZ",
      }),
    });

    const res = await route.POST(req);
    const body = await res.json();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.vivapayments.com/checkout/v2/orders",
      expect.objectContaining({ method: "POST" })
    );
    expect(res.status).toBe(502);
    expect(body).toEqual({
      error: "Failed to create payment",
      provider: "viva",
      providerError: {
        status: 403,
        message:
          "PaymentsPolicyAcquiringRestriction: Merchant acquiring restricted in 3ds flow",
        eventId: "2108",
      },
    });
  });
});
