-- BBB.EU payment middleware initial schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL,
  order_id TEXT NOT NULL,
  order_code TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL,
  amount_cents INTEGER,
  currency TEXT,
  country_code TEXT,
  lang TEXT,
  event_id TEXT,
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS payment_events_order_id_idx ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS payment_events_order_code_idx ON payment_events(order_code);
CREATE INDEX IF NOT EXISTS payment_events_tx_idx ON payment_events(transaction_id);
CREATE INDEX IF NOT EXISTS payment_events_created_idx ON payment_events(created_at);

CREATE TABLE IF NOT EXISTS provider_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  order_id TEXT,
  transaction_id TEXT,
  event_type TEXT,
  payload JSONB,
  CONSTRAINT provider_webhook_events_provider_key_uniq UNIQUE(provider, idempotency_key)
);
