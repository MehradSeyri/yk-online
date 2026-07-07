# Deployment — yk-online.eu (Vercel)

One Next.js project serves both the public site (`/`, `/terms`, `/privacy`,
`/complaints`, `/contact`) and the payment middleware (`/api/*`, `/web2/*`). Deploy to a
**Node** host. This guide uses Vercel.

> Not GitHub Pages — this is a Node app (crypto SHA512, server secrets, Prisma).
> The `CNAME` file is a leftover Pages artifact; ignored by Vercel.

---

## 1. Database (PostgreSQL)

Need a Postgres DB reachable from Vercel. Any works: Vercel Postgres, Neon,
Supabase, RDS.

### Supabase — use the POOLER, not the direct host

The direct host `db.<ref>.supabase.co:5432` is **IPv6-only** and is usually
unreachable from IPv4 networks and from Vercel → `P1001 Can't reach database
server`. Use the **Supavisor pooler** strings instead (Dashboard → Project
Settings → Database → Connection string → *Connection pooling*):

- `DATABASE_URL` (app runtime) — **transaction** pooler, port **6543**:
  `postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
- `DIRECT_URL` (migrations) — **session** pooler, port **5432**:
  `postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres`

`schema.prisma` already wires `url = DATABASE_URL` + `directUrl = DIRECT_URL`.

> If the project is **paused** (free tier auto-pauses), restore it in the
> dashboard first — that also shows up as `P1001`.
> URL-encode special chars in the password (`@` → `%40`, etc.).

Apply the schema (locally, pointing at prod):
```bash
npx prisma migrate deploy
```
Creates `payment_events` + `provider_webhook_events`. `gen_random_uuid()` needs
`pgcrypto` — migration `0001_init` enables it; on Supabase it is already on.

---

## 2. Import project to Vercel

1. Vercel → **Add New → Project** → import this Git repo.
2. Framework preset: **Next.js** (auto). Root dir: repo root. Build/install
   commands: defaults (`npm run build` already runs `prisma generate`).
3. Add the environment variables (section 4) **before** the first deploy.
4. Deploy.

---

## 3. Domain

1. Vercel → Project → **Settings → Domains** → add `yk-online.eu`
   (and `www.yk-online.eu` if used).
2. Point DNS as Vercel instructs (A/ALIAS or CNAME).
3. Set `SELF_URL=https://yk-online.eu` in env (used to build all provider
   return/webhook URLs). Redeploy after the domain is live.

---

## 4. Environment variables (Vercel → Settings → Environment Variables)

Set all for **Production** (and Preview if you test there). Everything is
server-side — none are `NEXT_PUBLIC_*`, nothing reaches the browser.

| Variable | Example / value | Secret | Notes |
|---|---|---|---|
| `NODE_ENV` | `production` | no | Vercel sets this automatically — usually skip |
| `SELF_URL` | `https://yk-online.eu` | no | Public base URL, no trailing slash |
| `SHOP_DOMAIN` | `https://aaa.cz` | no | AAA.CZ shop; redirect target |
| `INTERNAL_API_SECRET` | long random string | **yes** | Shared with AAA.CZ; verified on `/api/create-order` + forward header |
| `SHOP_WEBHOOK_URL` | `https://<ref>.supabase.co/functions/v1/payment-webhook` | no | AAA.CZ Edge Function |
| `SHOP_SUPABASE_ANON_KEY` | Supabase anon key | **yes** | Sent as `apikey` + `Authorization: Bearer` |
| `PAYMENT_PROVIDER_PRIMARY` | `comgate` | no | |
| `PAYMENT_PROVIDER_FALLBACK` | `viva` | no | Empty disables fallback |
| `COMGATE_ENV` | `live` | no | `live` or `test` |
| `COMGATE_MERCHANT` | from Comgate portal | no | Integrace → Propojení obchodu |
| `COMGATE_SECRET` | from Comgate portal | **yes** | Heslo pro komunikaci na pozadí |
| `COMGATE_METHOD` | `ALL` | no | `ALL` = plátce vybírá metodu |
| `GP_ENV` | `live` | no | `live` or `sandbox` |
| `GP_APP_ID` | from GP dashboard | no | |
| `GP_APP_KEY` | from GP dashboard | **yes** | Never log/expose |
| `GP_ACCOUNT_NAME` | transaction account name | no | Optional; from GP |
| `GP_API_VERSION` | `2021-03-22` | no | |
| `GP_WEBHOOK_TOKEN` | long random string | **yes** | Validated on `?token=` of GP webhook |
| `VIVA_ENV` | `live` | no | `live` or `demo` |
| `VIVA_CLIENT_ID` | from Viva | no | Smart Checkout OAuth client |
| `VIVA_CLIENT_SECRET` | from Viva | **yes** | |
| `VIVA_SOURCE_CODE` | payment source code | no | Viva → Sources |
| `VIVA_WEBHOOK_KEY` | from Viva webhook verification | **yes** | Returned on `GET /api/viva-webhook` |
| `DATABASE_URL` | `postgres://...pooler...:6543/postgres?pgbouncer=true&connection_limit=1` | **yes** | App runtime; Supabase transaction pooler (Section 1) |
| `DIRECT_URL` | `postgres://...pooler...:5432/postgres` | **yes** | Migrations; Supabase session pooler (Section 1) |
| `CRON_SECRET` | long random string | **yes** | Vercel Cron sends it as `Authorization: Bearer` |

Generate secrets: `openssl rand -hex 32`.

Startup validation (`lib/env.ts`) fails fast if a required var is missing — a
route will 500 with a clear `[env] Missing required ...` log. Required:
`SELF_URL`, `SHOP_DOMAIN`, `INTERNAL_API_SECRET`, `SHOP_WEBHOOK_URL`,
`SHOP_SUPABASE_ANON_KEY`, `DATABASE_URL`, plus provider-specific variables for
providers used in `PAYMENT_PROVIDER_PRIMARY` / `PAYMENT_PROVIDER_FALLBACK`:

- Comgate: `COMGATE_MERCHANT`, `COMGATE_SECRET`
- Viva: `VIVA_CLIENT_ID`, `VIVA_CLIENT_SECRET`, `VIVA_SOURCE_CODE`, `VIVA_WEBHOOK_KEY`
- GlobalPayments (legacy): `GP_APP_ID`, `GP_APP_KEY`, `GP_WEBHOOK_TOKEN`

---

## 5. Cron (reconciliation)

`vercel.json` already schedules `GET /api/reconcile` every 10 min. Vercel Cron
sends `Authorization: Bearer $CRON_SECRET` automatically once `CRON_SECRET` is
set. Cron is a Pro-plan feature; on Hobby trigger it manually:

```bash
curl https://yk-online.eu/api/reconcile -H "x-internal-secret: $INTERNAL_API_SECRET"
```

---

## 6. Provider dashboard configuration

**Comgate** — BBB.EU uses REST v2 for payment creation and status checks:
- create: `POST https://payments.comgate.cz/v2.0/payment.json`
- status: `GET https://payments.comgate.cz/v2.0/payment/transId/{transId}.json`
- auth: `Authorization: Basic base64(merchant:secret)`
- content type: `application/json`

URLs are still set per payment from BBB.EU payload:
- paid return: `https://yk-online.eu/web2/comgate-success?transId=${id}&refId=${refId}`
- cancelled return: `https://yk-online.eu/web2/comgate-fail?transId=${id}&refId=${refId}`
- pending return: `https://yk-online.eu/web2/comgate-pending?transId=${id}&refId=${refId}`
- background push: `https://yk-online.eu/api/comgate-webhook`

In Comgate portal (Integrace → Nastavení obchodů → Propojení obchodu), keep URL
configuration aligned to the same BBB.EU endpoints.

**Viva** — set in the Viva banking app (Settings → API Access → Webhooks):

### Step 1 – Generate VIVA_WEBHOOK_KEY

Before registering the webhook URL in the dashboard you need the verification key.
Call Viva's API with Basic auth (Merchant ID + API Key from Settings → API Access → General):

```bash
# Production  (note: www.vivapayments.com, NOT api.vivapayments.com)
curl -u "<MerchantId>:<ApiKey>" \
  https://www.vivapayments.com/api/messages/config/token

# Demo
curl -u "<MerchantId>:<ApiKey>" \
  https://demo.vivapayments.com/api/messages/config/token

# Response: {"Key":"46E655DAACB576BC53850614F51C21301FE47460"}
```

Set the returned value as `VIVA_WEBHOOK_KEY` in Vercel → Settings → Environment
Variables, then **redeploy** so the GET handler serves the new key.

Verify the endpoint is live before going to Step 2:
```bash
curl https://yk-online.eu/api/viva-webhook
# must return {"Key":"<non-empty string>"}
```

### Step 2 – Register and verify the URL in Viva dashboard

1. Login → Settings → API Access → Webhooks → **Create Webhook**
2. Enter URL: `https://yk-online.eu/api/viva-webhook`
3. Click **Verify** — Viva calls `GET` on that URL; app returns `{ "Key": "..." }`
4. Select Event Type: **Transaction Payment Created** (EventTypeId 1796)
5. Check **Active** → **Save**

Repeat for **Transaction Failed** (1798) and **Order Updated** (4865) as needed.

### IP allowlist (application layer)

The webhook route (`app/api/viva-webhook/route.ts`) enforces Viva's documented
IP ranges in production via `x-real-ip` / `x-forwarded-for`. Requests from
outside these ranges are rejected with HTTP 403. No changes to `vercel.json` or
Vercel firewall are required.

**Production IPs:** `51.138.37.238`, `40.127.253.112/28`, `51.105.129.192/28`,
`20.54.89.16`, `4.223.76.50`, `51.12.157.0/28`

**Demo IPs:** `20.50.240.57`, `40.74.20.78`, `195.167.87.181`, `195.167.87.180`,
`20.13.195.185`, `135.225.16.50`

The check is skipped when `NODE_ENV !== "production"` so local testing with
`curl` or Postman still works.

Other Viva URLs:
- success URL: `https://yk-online.eu/web2/success`
- failure URL: `https://yk-online.eu/web2/fail`

---

## 7. Post-deploy smoke test

```bash
# health
curl https://yk-online.eu/api/health
# -> {"ok":true,...}

# contact page required by acquirer domain review
curl -I https://yk-online.eu/contact
# -> HTTP/2 200

# viva verify handshake
curl https://yk-online.eu/api/viva-webhook
# -> {"Key":"..."}

# comgate webhook endpoint is online
curl -i https://yk-online.eu/api/comgate-webhook
# -> 200/405 depending on method; endpoint must be reachable

# create-order (auth)
curl -sX POST https://yk-online.eu/api/create-order \
  -H "x-internal-secret: $INTERNAL_API_SECRET" \
  -H "content-type: application/json" \
  -d '{"orderId":"TEST-1","amount":12.34,"currency":"EUR","lang":"cs","customerEmail":"a@b.cz"}'
# -> {"checkoutUrl":"...","provider":"...","providerRef":"..."}
```

Test with `COMGATE_ENV=test` / `VIVA_ENV=demo` first, then flip to live.

---

## 8.1 Webhook reliability checks (must pass before live)

1. Create a test order and complete a real demo payment.
2. Verify that AAA receives one final `status='paid'` webhook.
3. Simulate downstream outage (temporarily make `SHOP_WEBHOOK_URL` return 5xx).
4. Trigger the same provider webhook retry.
5. Verify BBB retries forwarding and AAA eventually receives `paid`.

Expected with current code:
- `confirmed` metric is written only after successful forward.
- Duplicate provider events for already-confirmed orders are acknowledged with `200` and not re-forwarded.
- Duplicate events for unconfirmed orders are retried safely.
- Viva paid webhook is revalidated against Viva API before forwarding.

---

## 8. Merchant-compliance info on the site (GP + Viva onboarding)

Acquirers review the live site before activating live payments. Present:

| Required | Where |
|---|---|
| Legal entity (YK Online, s.r.o.) | footer, contact, legal pages |
| Registered address | contact section + legal pages |
| Company ID (IČO) / VAT (DIČ) | footer, contact, legal pages |
| Contact e-mail + phone | contact section |
| Dedicated contact page | `/contact` |
| Terms & Conditions | `/terms` |
| Privacy Policy (GDPR) | `/privacy` |
| Complaints / refund / 14-day withdrawal | `/complaints` |
| Delivery (digital, instant) | "Why us" + catalog note |
| Prices, currency, VAT included | catalog note |
| Accepted cards (Visa/Mastercard) + secure-payment notice | footer |

> ℹ️ Phone `+420 775 170 443` set; DIČ/VAT removed (company shown as non-VAT).
> If the company is **not** VAT-registered, also change the "včetně DPH /
> including VAT" wording in the catalog note (`components/pricing.tsx`).

---

## 9. Incident Runbook (payments)

Use this when customers report "paid but order still unpaid" or onboarding asks
for operational controls.

### A. Quick triage (5 minutes)

1. Confirm BBB health:
  - `GET /api/health`
2. Check whether the order has a `confirmed` event in `payment_events`.
3. Check `provider_webhook_events` for duplicate webhook delivery patterns.
4. If no `confirmed`, run manual reconcile:
  - `GET /api/reconcile` with `x-internal-secret`.

### B. If provider webhook reached BBB but AAA was unavailable

Current implementation keeps the order retryable:
- `confirmed` is not persisted until `forwardToShop` succeeds.
- duplicate paid webhook retries for unconfirmed orders are processed again.

Action:
1. Restore AAA webhook availability.
2. Re-run reconcile or wait for provider retry.
3. Verify AAA order transitioned to `paid`.

### C. If Viva paid webhook is suspicious

Current implementation performs server-side revalidation via Viva order status.

Action:
1. Inspect logs for `viva-webhook.paid_revalidation_failed` or
  `viva-webhook.tx_mismatch`.
2. Do not mark order paid manually until transaction is confirmed in Viva
  dashboard/API.

### D. Post-incident evidence pack

Keep these artifacts for support/acquirer/audit:
- timestamped BBB logs (`comgate-webhook.*`, `gp-webhook.*`, `viva-webhook.*`, `webhook.forward_*`)
- `payment_events` rows for the order
- `provider_webhook_events` rows for the order
- AAA webhook response status/log excerpt

---

## 10. Minimal Go-Live Checklist (Viva)

1. `https://yk-online.eu/contact` returns HTTP 200 and shows legal identity + contact.
2. `GET /api/viva-webhook` returns `{ "Key": "..." }` with production key.
3. Viva dashboard webhook/success/failure URLs match section 6 exactly.
4. End-to-end demo payment completes and forwards `paid` to AAA.
5. Retry/outage scenario from section 8.1 is validated.
