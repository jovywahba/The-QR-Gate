-- ───────────────────────────────────────────────────────────────
-- The QR Gate — Stripe billing schema (REFERENCE / paste-ready).
--
-- ⚠️ You do NOT need to run this. Every object below is ALREADY applied
-- via 0000_init + 0002_auth_billing_analytics (+ 0004 for the effective
-- plan). It is provided per the spec as a self-contained, idempotent
-- reference of exactly what the Stripe integration relies on. Re-running
-- it is a safe no-op. No credentials, no real Stripe ids, no user UUIDs.
--
-- Security invariants this encodes (hard gate §10):
--   • The browser can READ its own subscription but can NEVER write paid
--     status — subscriptions/profiles.stripe_customer_id are written only
--     by the service role (the signature-verified webhook).
--   • The browser can NEVER create processed-webhook-event rows.
--   • No card data / API secrets / webhook secrets are ever stored.
-- ───────────────────────────────────────────────────────────────

-- ══ 1. profiles.stripe_customer_id — one Stripe customer ↔ one user ══
alter table public.profiles add column if not exists stripe_customer_id text;
create unique index if not exists profiles_stripe_customer_uniq on public.profiles (stripe_customer_id);
-- (profiles UPDATE for end users is column-restricted to full_name/avatar_url in
--  0004, so a user cannot self-edit stripe_customer_id.)

-- ══ 2. subscriptions — a mirror of the Stripe subscription ═════════
create table if not exists public.subscriptions (
  id                     text primary key,          -- Stripe subscription id
  user_id                uuid not null references auth.users (id) on delete cascade,
  status                 text not null,             -- trialing | active | past_due | canceled | ...
  price_id               text,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);
-- Full Stripe mirror columns (safe identifiers only — never card/secret data).
alter table public.subscriptions add column if not exists stripe_customer_id     text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists stripe_price_id        text;
alter table public.subscriptions add column if not exists current_period_start   timestamptz;
alter table public.subscriptions add column if not exists cancel_at_period_end   boolean not null default false;
alter table public.subscriptions add column if not exists created_at             timestamptz not null default now();

alter table public.subscriptions enable row level security;

-- Users may READ their own subscription; NO insert/update/delete policies exist,
-- so only the service role (webhook) can write it.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create index if not exists subscriptions_user_id_idx     on public.subscriptions (user_id);
create index if not exists subscriptions_customer_idx    on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_status_idx      on public.subscriptions (status);

-- ══ 3. stripe_webhook_events — idempotency ledger ═════════════════
-- One row per fully-processed Stripe event id, so retries are deduped.
create table if not exists public.stripe_webhook_events (
  event_id     text primary key,
  event_type   text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;
-- No policies at all → only the service role (webhook) can read/write it.

-- ══ 4. Effective plan ═════════════════════════════════════════════
-- public.get_user_plan_status() (defined in 0002, upgraded in 0004) returns
-- is_unlimited = (active/trialing Stripe sub) OR (active complimentary
-- entitlement), plus a `complimentary` flag so the two stay separate.
-- try_activate_qr() enforces the 3-free-active quota against that same
-- effective plan. See 0004_admin_expansion.sql — no changes needed here.
