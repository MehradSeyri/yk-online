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
