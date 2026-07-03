# Deployment Split: AAA.CZ vs BBB.EU (Comgate)

This document separates exactly what must be configured on:
- AAA.CZ (shop)
- BBB.EU = yk-online.eu (payment middleware)

It covers both flows:
1. AAA.CZ checkout -> BBB.EU -> Comgate (primary production flow)
2. Direct purchase on BBB.EU landing page (public card checkout)

---

## 1) BBB.EU (yk-online.eu) - required changes

### 1.1 Environment variables (Vercel)

Set in BBB.EU project environment:

- SELF_URL=https://yk-online.eu
- SHOP_DOMAIN=https://aaa.cz
- INTERNAL_API_SECRET=<shared secret with AAA>
- SHOP_WEBHOOK_URL=<AAA payment-webhook URL>
- SHOP_SUPABASE_ANON_KEY=<AAA Supabase anon key>
- PAYMENT_PROVIDER_PRIMARY=comgate
- PAYMENT_PROVIDER_FALLBACK=viva (optional)
- COMGATE_ENV=live (or test)
- COMGATE_MERCHANT=<from Comgate portal>
- COMGATE_SECRET=<from Comgate portal>
- COMGATE_METHOD=ALL
- VIVA_ENV=live (or demo, if fallback enabled)
- VIVA_CLIENT_ID=<if Viva fallback enabled>
- VIVA_CLIENT_SECRET=<if Viva fallback enabled>
- VIVA_SOURCE_CODE=<if Viva fallback enabled>
- VIVA_WEBHOOK_KEY=<if Viva fallback enabled>
- DATABASE_URL=<postgres runtime>
- DIRECT_URL=<postgres migrate>
- CRON_SECRET=<cron bearer>

### 1.2 Comgate integration points on BBB.EU

Implemented endpoints:

- Create payment: POST /api/create-order (for AAA.CZ)
- Public direct checkout create: POST /api/public-checkout (for yk-online.eu direct buyers)
- Background push webhook: /api/comgate-webhook
- Return redirects:
  - /web2/comgate-success
  - /web2/comgate-fail
  - /web2/comgate-pending

Behavior:
- Webhook is idempotent.
- Payment status is always revalidated via Comgate /v1.0/status.
- For AAA-origin orders, paid events are forwarded to AAA payment-webhook.
- For BBB direct web orders (orderId prefix BBBWEB-), paid is confirmed locally and not forwarded to AAA.

### 1.3 Comgate portal setup (Integrace -> Propojeni obchodu)

Configure URLs to BBB.EU:

- PAID URL: https://yk-online.eu/web2/comgate-success
- CANCELLED URL: https://yk-online.eu/web2/comgate-fail
- PENDING URL: https://yk-online.eu/web2/comgate-pending
- URL pro predani vysledku na pozadi (push): https://yk-online.eu/api/comgate-webhook

Also verify:
- Correct merchant ID + secret
- IP whitelist for BBB.EU outgoing IPs (if enabled)
- Test mode first (COMGATE_ENV=test), then live

### 1.4 Direct purchase on yk-online.eu

Current behavior after deployment:
- User selects product in landing modal
- On card payment, frontend calls POST /api/public-checkout
- BBB creates Comgate payment and redirects customer to Comgate
- After success/fail/pending, customer is redirected back via BBB /web2/comgate-*

---

## 2) AAA.CZ - required changes

### 2.1 Keep/create order before payment

AAA should create order in unpaid/pending state first, then call BBB:

POST https://yk-online.eu/api/create-order
Headers:
- x-internal-secret: <INTERNAL_API_SECRET>
- content-type: application/json

Body (minimum):
- orderId (AAA order ID)
- amount (major units, e.g. 12.34)
- currency (ISO alpha-3, e.g. EUR/CZK)
- customerEmail (recommended, Comgate strongly expects contact)
- customerName (recommended)
- customerPhone (optional)
- lang (cs/en)

Expected response:
- checkoutUrl
- provider
- providerRef

AAA should redirect browser to checkoutUrl.

### 2.2 AAA payment webhook endpoint must accept BBB paid callback

BBB forwards normalized paid payload to AAA webhook endpoint:

Headers:
- apikey: SHOP_SUPABASE_ANON_KEY
- Authorization: Bearer SHOP_SUPABASE_ANON_KEY
- x-internal-secret: INTERNAL_API_SECRET

Body:
- provider: comgate|viva|globalpayments
- orderId
- status: paid
- transactionId
- providerRef
- amount (minor units)
- currency
- email
- fullName

AAA webhook requirements:
- verify x-internal-secret
- idempotent processing
- monotonic status (unpaid -> paid only)
- persist payment references
- return HTTP 2xx on success

### 2.3 AAA return pages

BBB redirects customer to AAA routes:
- /payment/success?order=<orderId>
- /payment/failed?order=<orderId>
- /payment/pending?order=<orderId>

Make sure AAA has these routes/pages and they do not change order state to paid.
Final truth remains webhook/reconcile.

---

## 3) End-to-end verification checklist

### 3.1 BBB-only direct purchase (yk-online.eu)

1. Open yk-online.eu
2. Pick product -> card payment
3. Confirm redirect to Comgate
4. Complete payment in test mode
5. Verify BBB payment_events includes initiated + confirmed for BBBWEB-* order

### 3.2 AAA -> BBB -> Comgate flow

1. Create order on AAA
2. AAA calls BBB /api/create-order
3. Customer is redirected to Comgate and pays
4. BBB /api/comgate-webhook receives push and revalidates status
5. BBB forwards paid to AAA webhook
6. AAA marks order paid

### 3.3 Failure/retry scenario

1. Temporarily force AAA webhook to return non-2xx
2. Complete payment
3. Verify BBB does not persist confirmed for AAA order until forward succeeds
4. Restore AAA webhook
5. Verify retry/reconcile eventually marks AAA order paid

---

## 4) Cutover recommendation

1. Deploy BBB.EU with Comgate changes
2. Configure Comgate portal URLs to BBB endpoints
3. Set COMGATE_ENV=test and validate both flows
4. Switch COMGATE_ENV=live
5. Monitor logs:
   - comgate.create.*
   - comgate-webhook.*
   - webhook.forwarded / webhook.forward_non_2xx

---

## 5) AAA.CZ implementation spec for LLM (step-by-step)

Use this section as a direct execution brief for an LLM coding agent.

### 5.1 Goal

Implement AAA.CZ checkout so that:
1. AAA creates an unpaid order.
2. AAA calls BBB `POST /api/create-order`.
3. AAA redirects customer to returned `checkoutUrl`.
4. AAA marks order as paid only from BBB webhook callback (`status=paid`).

### 5.2 Constraints (must follow)

1. Never mark order as paid from browser return route.
2. Treat BBB webhook as at-least-once delivery (duplicates are expected).
3. Keep monotonic payment transition: `unpaid -> paid` only.
4. Verify shared secret on all internal endpoints.
5. Persist provider references for audit and support.

### 5.3 Required AAA env vars

1. `BBB_CREATE_ORDER_URL=https://yk-online.eu/api/create-order`
2. `BBB_INTERNAL_API_SECRET=<same value as BBB INTERNAL_API_SECRET>`
3. `BBB_WEBHOOK_ANON_KEY=<same as BBB SHOP_SUPABASE_ANON_KEY>` (if AAA webhook gateway enforces it)

### 5.4 Data model changes on AAA orders

Add/confirm these fields exist on order entity:

1. `payment_status` enum/string (`unpaid`, `paid`)
2. `payment_provider` (string)
3. `payment_transaction_id` (string)
4. `payment_order_code` (string) - provider reference from BBB (`providerRef`)
5. `paid_at` (datetime, nullable)
6. Optional idempotency helper: `payment_confirmed_at` or unique index by `payment_transaction_id`

### 5.5 Endpoint A: create checkout on AAA

Implement/adjust AAA endpoint that starts payment (example: `POST /api/checkout/create-payment`).

Processing steps:

1. Validate input (order, amount, currency, customer identity).
2. Ensure order exists and is in unpaid state.
3. Create/update local order as unpaid + pending payment initialization.
4. Call BBB `POST /api/create-order` with:
  - Header `x-internal-secret: BBB_INTERNAL_API_SECRET`
  - JSON body:
    - `orderId`: AAA order ID (string)
    - `amount`: major units, decimal (e.g. `12.34`)
    - `currency`: ISO alpha-3 (e.g. `CZK`, `EUR`)
    - `lang`: `cs` or `en`
    - `customerEmail` (recommended)
    - `customerName` (recommended)
    - `customerPhone` (optional)
5. Expect 200 with:
  - `checkoutUrl`
  - `provider`
  - `providerRef`
6. Persist `payment_provider` + `payment_order_code=providerRef`.
7. Return `checkoutUrl` to frontend and immediately redirect customer.

Failure behavior:

1. If BBB returns non-2xx, keep order unpaid.
2. Return recoverable error to frontend (retry possible).
3. Log request correlation IDs + order ID.

### 5.6 Endpoint B: webhook receiver on AAA

Implement/adjust AAA webhook endpoint that BBB calls (example: Supabase Edge Function `payment-webhook`).

Mandatory request verification:

1. Check header `x-internal-secret == BBB_INTERNAL_API_SECRET`.
2. If invalid, return 401.

Expected payload:

1. `provider`
2. `orderId`
3. `status` (always `paid` from BBB)
4. `transactionId`
5. `providerRef`
6. `amount` (minor units)
7. `currency`
8. `email`
9. `fullName`

Processing logic:

1. Load order by `orderId`.
2. If order not found, return 404 (or 200 + logged anomaly if your retry policy requires).
3. Idempotency guard:
  - if order already paid, return 200 without changes.
  - if same `transactionId` already stored, return 200.
4. Monotonic transition:
  - only `unpaid -> paid` is allowed.
5. Update order atomically:
  - `payment_status=paid`
  - `payment_provider=provider`
  - `payment_transaction_id=transactionId`
  - `payment_order_code=providerRef`
  - `paid_at=now()`
6. Trigger post-payment hooks once (email, fulfillment, analytics, Klaviyo etc.).
7. Return HTTP 200.

### 5.7 Return pages on AAA (customer UX only)

Provide routes:

1. `/payment/success?order=<id>`
2. `/payment/failed?order=<id>`
3. `/payment/pending?order=<id>`

Rules:

1. Do not set paid state in these pages.
2. Show current order payment status from database.
3. If success page is opened before webhook arrival, show "processing/awaiting confirmation" and polling/reload CTA.

### 5.8 LLM execution plan (recommended order)

1. Add/verify order payment columns.
2. Implement BBB create-order client function in AAA backend service layer.
3. Implement checkout-start endpoint calling that service.
4. Implement/patch BBB webhook receiver endpoint with idempotent paid transition.
5. Patch success/failed/pending pages to be read-only status views.
6. Add tests from section 5.9.

### 5.9 Test cases AAA LLM must implement

1. Create-payment happy path:
  - BBB returns checkoutUrl -> AAA stores providerRef and returns URL.
2. Create-payment failure:
  - BBB 5xx -> AAA keeps order unpaid.
3. Webhook happy path:
  - unpaid order + valid secret -> becomes paid.
4. Webhook duplicate:
  - second same payload -> no duplicate side effects.
5. Webhook monotonicity:
  - paid order receiving another event -> no revert.
6. Return page safety:
  - success route hit without webhook -> order remains unpaid.

### 5.10 Acceptance criteria

Implementation is complete when:

1. AAA can create Comgate checkout through BBB and redirect customer.
2. Only BBB webhook marks order paid.
3. Duplicate callbacks are harmless.
4. Failed BBB forwarding can be retried without data corruption.
5. Support can trace payment via `orderId`, `providerRef`, `transactionId`.
