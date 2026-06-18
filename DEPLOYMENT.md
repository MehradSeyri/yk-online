# Deployment — yk-online.eu (Vercel)

One Next.js project serves both the public site (`/`, `/terms`, `/privacy`,
`/complaints`) and the payment middleware (`/api/*`, `/web2/*`). Deploy to a
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
| `PAYMENT_PROVIDER_PRIMARY` | `globalpayments` | no | |
| `PAYMENT_PROVIDER_FALLBACK` | `viva` | no | Empty disables fallback |
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
`SHOP_SUPABASE_ANON_KEY`, `GP_APP_ID`, `GP_APP_KEY`, `GP_WEBHOOK_TOKEN`,
`VIVA_CLIENT_ID`, `VIVA_CLIENT_SECRET`, `VIVA_SOURCE_CODE`, `VIVA_WEBHOOK_KEY`,
`DATABASE_URL`.

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

**GlobalPayments** — link notification URLs are set automatically by the code on
every link, all pointing at BBB.EU:
- return: `https://yk-online.eu/web2/gp-success`
- cancel: `https://yk-online.eu/web2/gp-fail`
- status: `https://yk-online.eu/api/gp-webhook?token=<GP_WEBHOOK_TOKEN>`

**Viva** — set in the Viva dashboard:
- Webhook URL: `https://yk-online.eu/api/viva-webhook`
  (Viva calls `GET` first → app returns `{ "Key": VIVA_WEBHOOK_KEY }`)
- success URL: `https://yk-online.eu/web2/success`
- failure URL: `https://yk-online.eu/web2/fail`

---

## 7. Post-deploy smoke test

```bash
# health
curl https://yk-online.eu/api/health
# -> {"ok":true,...}

# viva verify handshake
curl https://yk-online.eu/api/viva-webhook
# -> {"Key":"..."}

# create-order (auth)
curl -sX POST https://yk-online.eu/api/create-order \
  -H "x-internal-secret: $INTERNAL_API_SECRET" \
  -H "content-type: application/json" \
  -d '{"orderId":"TEST-1","amount":12.34,"currency":"EUR","lang":"cs","customerEmail":"a@b.cz"}'
# -> {"checkoutUrl":"...","provider":"...","providerRef":"..."}
```

Test with `GP_ENV=sandbox` / `VIVA_ENV=demo` first, then flip to live.

---

## 8. Merchant-compliance info on the site (GP + Viva onboarding)

Acquirers review the live site before activating live payments. Present:

| Required | Where |
|---|---|
| Legal entity (YK Online, s.r.o.) | footer, contact, legal pages |
| Registered address | contact section + legal pages |
| Company ID (IČO) / VAT (DIČ) | footer, contact, legal pages |
| Contact e-mail + phone | contact section |
| Terms & Conditions | `/terms` |
| Privacy Policy (GDPR) | `/privacy` |
| Complaints / refund / 14-day withdrawal | `/complaints` |
| Delivery (digital, instant) | "Why us" + catalog note |
| Prices, currency, VAT included | catalog note |
| Accepted cards (Visa/Mastercard) + secure-payment notice | footer |

> ℹ️ Phone `+420 775 170 443` set; DIČ/VAT removed (company shown as non-VAT).
> If the company is **not** VAT-registered, also change the "včetně DPH /
> including VAT" wording in the catalog note (`components/pricing.tsx`).
