# BBB.EU Payment Middleware

Invisible payment middleware between **AAA.CZ** (shop, Supabase) and the payment
gateways. **Comgate** is primary, **Viva** is fallback. The customer only
ever sees AAA.CZ and the gateway's hosted checkout page. BBB.EU never renders
customer-facing pages — it only creates payments, redirects, and forwards
webhooks.

## Flow

1. AAA.CZ → `POST /api/create-order` (auth via `x-internal-secret`).
2. BBB.EU tries PRIMARY provider; on a **creation** failure tries FALLBACK.
3. Returns `{ checkoutUrl, provider, providerRef }`.
4. AAA.CZ redirects the customer to the hosted checkout.
5. Gateway returns the customer to a BBB.EU success/fail route → **302** to AAA.CZ.
6. Gateway webhook → BBB.EU → normalized → forwarded to the AAA.CZ
   `payment-webhook` Supabase Edge Function.
7. AAA.CZ sets the order `paid`, stores the transaction reference, fires Klaviyo.

> Fallback applies **only** to payment creation, never after payment — no double
> charge. The webhook flow is the **only** source of truth for `paid`. Success/
> fail redirect routes are UX + metrics only.

## State guarantees

- `unpaid → paid` allowed; `paid → unpaid` forbidden (monotonic).
- Every provider event has an idempotency key
  (`provider + transactionId + eventType`) with a UNIQUE constraint in
  `provider_webhook_events`. Duplicate → `200 OK`, no reprocessing.
- BBB.EU forwards only the final `status='paid'`.
- If the forward to AAA.CZ fails, BBB.EU returns **5xx** so the gateway retries.
- A reconcile cron closes gaps where a webhook never arrived.

## Tech

- Next.js 14 (App Router), TypeScript, Prisma + PostgreSQL.
- Node runtime on every route (crypto SHA512, server secrets).

## Files

| File | Purpose |
|------|---------|
| `lib/env.ts` | Fail-fast env validation |
| `lib/comgate.ts` | Comgate create payment + status retrieve |
| `app/api/comgate-webhook/route.ts` | Comgate background push webhook |
| `lib/viva-auth.ts` | Viva OAuth2 token (cached) |
| `lib/viva.ts` | Viva create order + status retrieve |
| `lib/providers.ts` | Router with primary→fallback |
| `lib/webhook-core.ts` | Dedup, metrics, confirm+forward |
| `lib/forward.ts` | Forward to AAA.CZ Supabase |
| `app/api/create-order/route.ts` | Entry from AAA.CZ |
| `app/api/gp-webhook/route.ts` | GP webhook (legacy) |
| `app/api/viva-webhook/route.ts` | Viva webhook (GET verify + POST) |
| `app/web2/comgate-success`/`comgate-fail`/`comgate-pending` | Comgate redirects |
| `app/web2/gp-success`/`gp-fail` | GP redirects |
| `app/web2/success`/`fail` | Viva redirects |
| `app/api/reconcile/route.ts` | Cron reconciliation |

## Setup

Single Next.js project at the repo root. It serves **both** the public landing
site (`/`, `/terms`, `/privacy`, `/complaints`) and the payment middleware
(`/api/*`, `/web2/*`) — one deployment (e.g. one Vercel project).

```bash
cp .env.example .env        # fill in secrets
npm install
npx prisma migrate deploy   # or: npx prisma migrate dev (local)
npm run build
npm start
```

`prisma generate` runs automatically in `npm run build`.

### Landing site (TypeScript / React)

The former static `index.html` + `app.js` + `style.css` are rewritten as App
Router pages and client components:

| Path | Source |
|------|--------|
| `app/page.tsx` | landing (Hero, Services, Pricing, WhyUs, Contact) |
| `app/terms` · `app/privacy` · `app/complaints` | legal pages (bilingual) |
| `app/layout.tsx` | global Navbar / Footer / Modals / Toast + fonts |
| `app/globals.css` | former `style.css` (design unchanged) |
| `components/site-context.tsx` | CS/EN i18n, demo auth, modals, orders, toast |
| `components/t.tsx` | `<T cs en/>` bilingual text node |
| `components/{navbar,hero,sections,pricing,contact-footer,modals,legal-shell}.tsx` | UI |

Language (CS/EN), demo login/register, inquiry → order history and the bank QR
are client-side only (localStorage) — same behaviour as the original page.

## Provider configuration

Point the gateway notification/return URLs at BBB.EU:

**Comgate** (v1.0 create + background push):
- create endpoint: `POST https://payments.comgate.cz/v1.0/create` (`prepareOnly=true`)
- status endpoint: `POST https://payments.comgate.cz/v1.0/status`
- return URLs per payment:
  - paid: `${SELF_URL}/web2/comgate-success?transId=${id}&refId=${refId}`
  - cancelled: `${SELF_URL}/web2/comgate-fail?transId=${id}&refId=${refId}`
  - pending: `${SELF_URL}/web2/comgate-pending?transId=${id}&refId=${refId}`
- background push URL: `${SELF_URL}/api/comgate-webhook`

The webhook handler always re-validates paid status via `/v1.0/status` before
forwarding to AAA.CZ.

**Viva** (set in the Viva dashboard):
- Webhook URL: `${SELF_URL}/api/viva-webhook`
  (Viva verifies via `GET` → `{ "Key": VIVA_WEBHOOK_KEY }`)
- success URL: `${SELF_URL}/web2/success`
- failure URL: `${SELF_URL}/web2/fail`

## Status mapping

**Comgate**
- webhook/redirect input is treated as untrusted; status is verified via `/v1.0/status`
- `PAID` → forward `status='paid'` (metric `confirmed`)
- `CANCELLED` → metric `failed`, no forward
- `PENDING`/`AUTHORIZED` → waiting, no forward

**Viva** (strict)
- `EventTypeId == 1796 && StatusId == 'F'` → forward `status='paid'`
- anything else → metric `failed`, no forward

## Forward contract (to AAA.CZ `payment-webhook`)

Headers:
```
Content-Type: application/json
apikey: <SHOP_SUPABASE_ANON_KEY>
Authorization: Bearer <SHOP_SUPABASE_ANON_KEY>
x-internal-secret: <INTERNAL_API_SECRET>
```
Body:
```json
{
  "provider": "comgate|viva|globalpayments",
  "orderId": "...",
  "status": "paid",
  "transactionId": "...",
  "providerRef": "...",
  "amount": 1234,
  "currency": "EUR",
  "email": "...",
  "fullName": "..."
}
```
AAA.CZ `payment-webhook` must: verify `x-internal-secret`, be idempotent +
monotonic (`unpaid→paid` only), store `payment_method`/`payment_transaction_id`/
`payment_order_code`, and fire Klaviyo.

## Reconcile cron

`*/10 * * * *` → `GET /api/reconcile` (see `vercel.json`). Authorized via
`Authorization: Bearer ${CRON_SECRET}` (Vercel Cron sets this automatically when
`CRON_SECRET` is configured) or `x-internal-secret`. Selects `initiated` events
older than 5 min without a `confirmed`, queries the provider, and forwards paid
results through the same dedup path.

## Testing

```bash
# create-order
curl -sX POST "$SELF_URL/api/create-order" \
  -H "x-internal-secret: $INTERNAL_API_SECRET" \
  -H "content-type: application/json" \
  -d '{"orderId":"TEST-1","amount":12.34,"currency":"EUR","lang":"cs","customerEmail":"a@b.cz"}'

# viva verify handshake
curl -s "$SELF_URL/api/viva-webhook"   # -> {"Key":"..."}

# reconcile (manual)
curl -s "$SELF_URL/api/reconcile" -H "x-internal-secret: $INTERNAL_API_SECRET"
```

Use test mode first: `COMGATE_ENV=test`, `VIVA_ENV=demo`.

## Security

- Secrets are server-side only; nothing reaches the client bundle.
- `x-internal-secret` verified on `/api/create-order` and accepted on reconcile.
- Webhook tokens/keys verified on gateway webhooks.
- Idempotent webhook processing; duplicates ack `200`.
- Logs are structured JSON with sensitive keys redacted.
