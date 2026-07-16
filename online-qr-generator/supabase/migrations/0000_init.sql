-- ───────────────────────────────────────────────────────────────
-- Halfstack template — base schema. RLS-first (hard gate §10): every table
-- has RLS ON, default deny, with explicit owner-only policies.
-- Subscriptions are written ONLY by the service role (Stripe webhook).
-- ───────────────────────────────────────────────────────────────

-- Profiles: 1:1 with auth.users, holds the Stripe customer id.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Subscriptions: synced from Stripe. Users read their own; only the
-- service role writes (no insert/update/delete policies for end users).
create table if not exists public.subscriptions (
  id text primary key,                          -- Stripe subscription id
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null,                         -- trialing | active | past_due | canceled | ...
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
