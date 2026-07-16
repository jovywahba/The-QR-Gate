-- ═══════════════════════════════════════════════════════════════
-- THE QR GATE — FULL SUPABASE SETUP (consolidated, idempotent)
--
-- Copy this entire file into the Supabase SQL Editor and run it ONCE.
-- It is safe to re-run (drop-if-exists / on-conflict guards).
--
-- Source of truth: supabase/migrations/0000_init.sql and
-- supabase/migrations/0001_qr_codes.sql — this file consolidates them
-- verbatim in execution order for the SQL Editor. Keep the migration
-- files authoritative for future changes.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- SECTION 1 · Base schema (profiles + subscriptions + signup trigger)
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create table if not exists public.subscriptions (
  id text primary key,                          -- Stripe subscription id
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null,                         -- trialing | active | past_due | canceled | ...
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
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

-- ─────────────────────────────────────────────────────────────────
-- SECTION 2 · Shared updated_at trigger function
-- ─────────────────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────
-- SECTION 3 · qr_codes (one row per QR the user builds)
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.qr_codes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users (id) on delete cascade,
  type            text not null check (type in (
                    'website','pdf','links','vcard','business','video','images',
                    'facebook','instagram','social','whatsapp','mp3','menu',
                    'apps','coupon','wifi'
                  )),
  name            text,
  slug            text unique,                    -- set at publish (crypto-random)
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  content         jsonb not null default '{}'::jsonb,
  design          jsonb not null default '{}'::jsonb,
  destination_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz
);

alter table public.qr_codes enable row level security;

drop policy if exists "qr_codes_select_own" on public.qr_codes;
create policy "qr_codes_select_own" on public.qr_codes
  for select using (auth.uid() = user_id);

drop policy if exists "qr_codes_insert_own" on public.qr_codes;
create policy "qr_codes_insert_own" on public.qr_codes
  for insert with check (auth.uid() = user_id);

drop policy if exists "qr_codes_update_own" on public.qr_codes;
create policy "qr_codes_update_own" on public.qr_codes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "qr_codes_delete_own" on public.qr_codes;
create policy "qr_codes_delete_own" on public.qr_codes
  for delete using (auth.uid() = user_id);

create index if not exists qr_codes_user_id_idx      on public.qr_codes (user_id);
create index if not exists qr_codes_type_idx         on public.qr_codes (type);
create index if not exists qr_codes_status_idx       on public.qr_codes (status);
create index if not exists qr_codes_created_at_idx   on public.qr_codes (created_at);
create index if not exists qr_codes_published_at_idx on public.qr_codes (published_at);
-- slug already has a unique index via the constraint.

drop trigger if exists qr_codes_updated_at on public.qr_codes;
create trigger qr_codes_updated_at
  before update on public.qr_codes
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- SECTION 4 · qr_link_items (List-of-Links entries)
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.qr_link_items (
  id         uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  label      text not null,
  url        text not null,
  icon       text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.qr_link_items enable row level security;

drop policy if exists "qr_link_items_all_own" on public.qr_link_items;
create policy "qr_link_items_all_own" on public.qr_link_items
  for all
  using (exists (select 1 from public.qr_codes c where c.id = qr_code_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.qr_codes c where c.id = qr_code_id and c.user_id = auth.uid()));

create index if not exists qr_link_items_qr_code_id_idx on public.qr_link_items (qr_code_id);

-- ─────────────────────────────────────────────────────────────────
-- SECTION 5 · qr_social_items (Social-Media entries)
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.qr_social_items (
  id         uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  platform   text not null,
  label      text,
  url        text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.qr_social_items enable row level security;

drop policy if exists "qr_social_items_all_own" on public.qr_social_items;
create policy "qr_social_items_all_own" on public.qr_social_items
  for all
  using (exists (select 1 from public.qr_codes c where c.id = qr_code_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.qr_codes c where c.id = qr_code_id and c.user_id = auth.uid()));

create index if not exists qr_social_items_qr_code_id_idx on public.qr_social_items (qr_code_id);

-- ─────────────────────────────────────────────────────────────────
-- SECTION 6 · qr_assets (uploaded files: PDFs, images, audio, video)
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.qr_assets (
  id           uuid primary key default gen_random_uuid(),
  qr_code_id   uuid not null references public.qr_codes (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  asset_type   text not null check (asset_type in (
                 'pdf','image','logo','cover','thumbnail','audio','video','icon'
               )),
  storage_path text not null,          -- private bucket path {userId}/{qrId}/{uuid}-{name}
  public_url   text,                   -- set when copied to qr-public at publish
  mime_type    text not null,
  file_name    text not null,
  file_size    bigint not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.qr_assets enable row level security;

drop policy if exists "qr_assets_select_own" on public.qr_assets;
create policy "qr_assets_select_own" on public.qr_assets
  for select using (auth.uid() = user_id);

drop policy if exists "qr_assets_insert_own" on public.qr_assets;
create policy "qr_assets_insert_own" on public.qr_assets
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.qr_codes c where c.id = qr_code_id and c.user_id = auth.uid())
  );

drop policy if exists "qr_assets_update_own" on public.qr_assets;
create policy "qr_assets_update_own" on public.qr_assets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "qr_assets_delete_own" on public.qr_assets;
create policy "qr_assets_delete_own" on public.qr_assets
  for delete using (auth.uid() = user_id);

create index if not exists qr_assets_qr_code_id_idx on public.qr_assets (qr_code_id);
create index if not exists qr_assets_user_id_idx    on public.qr_assets (user_id);

-- ─────────────────────────────────────────────────────────────────
-- SECTION 7 · Public read path (published records only, safe fields)
-- Anonymous visitors have NO select policy on the tables — this
-- security-definer function is the only public read surface.
-- ─────────────────────────────────────────────────────────────────

create or replace function public.get_public_qr(p_slug text)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'slug', c.slug,
    'type', c.type,
    'name', c.name,
    'content', c.content,
    'design', c.design,
    'published_at', c.published_at,
    'assets', coalesce(
      (select jsonb_agg(jsonb_build_object(
         'id', a.id,
         'asset_type', a.asset_type,
         'public_url', a.public_url,
         'file_name', a.file_name,
         'file_size', a.file_size,
         'mime_type', a.mime_type,
         'sort_order', a.sort_order
       ) order by a.sort_order)
       from public.qr_assets a
       where a.qr_code_id = c.id and a.public_url is not null),
      '[]'::jsonb
    )
  )
  from public.qr_codes c
  where c.slug = p_slug
    and c.status = 'published';
$$;

revoke all on function public.get_public_qr(text) from public;
grant execute on function public.get_public_qr(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- SECTION 8 · Storage buckets
-- qr-private: draft uploads, owner-only. qr-public: published copies,
-- world-readable, written ONLY by the service role (publish flow).
-- ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('qr-private', 'qr-private', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('qr-public', 'qr-public', true)
on conflict (id) do nothing;

-- Private bucket: users touch only their own {userId}/... prefix.
drop policy if exists "qr_private_select_own" on storage.objects;
create policy "qr_private_select_own" on storage.objects
  for select using (
    bucket_id = 'qr-private' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "qr_private_insert_own" on storage.objects;
create policy "qr_private_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'qr-private' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "qr_private_update_own" on storage.objects;
create policy "qr_private_update_own" on storage.objects
  for update using (
    bucket_id = 'qr-private' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "qr_private_delete_own" on storage.objects;
create policy "qr_private_delete_own" on storage.objects
  for delete using (
    bucket_id = 'qr-private' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public bucket: world-readable; NO insert/update/delete policies —
-- only the service role (publish flow, bypasses RLS) writes here.
drop policy if exists "qr_public_select_all" on storage.objects;
create policy "qr_public_select_all" on storage.objects
  for select using (bucket_id = 'qr-public');

-- ═══════════════════════════════════════════════════════════════
-- DONE. Verify afterwards:
--   · Tables: profiles, subscriptions, qr_codes, qr_link_items,
--     qr_social_items, qr_assets — all with RLS enabled
--   · Function: get_public_qr(text)
--   · Storage buckets: qr-private (private), qr-public (public)
--   · Then locally: pnpm verify:supabase
-- ═══════════════════════════════════════════════════════════════
