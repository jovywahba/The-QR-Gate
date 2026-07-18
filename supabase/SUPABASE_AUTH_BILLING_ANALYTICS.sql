-- ═══════════════════════════════════════════════════════════════
-- The QR Gate — CONSOLIDATED SETUP: auth profiles, $10 Pro
-- subscription, QR ownership quota, and real scan analytics.
--
-- HOW TO RUN: paste this whole file ONCE into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → Run) for this app's project.
-- It assumes 0000_init.sql and 0001_qr_codes.sql already ran (they
-- created profiles, subscriptions, qr_codes + storage). This file is
-- the exact copy of migration 0002_auth_billing_analytics.sql.
--
-- Idempotent: safe to run more than once. RLS-first (hard gate §10).
-- Billing rows are written ONLY by the service role (Stripe webhook);
-- scan events ONLY by the service role (scan routes). End users never
-- insert either.
-- ═══════════════════════════════════════════════════════════════

-- ══ 1. profiles — richer identity (name/avatar from OAuth) ═══════
alter table public.profiles add column if not exists full_name  text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Capture name/avatar from the signup identity (Google fills raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

-- ══ 2. subscriptions — full Stripe mirror ═══════════════════════
alter table public.subscriptions add column if not exists stripe_customer_id     text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists stripe_price_id        text;
alter table public.subscriptions add column if not exists current_period_start   timestamptz;
alter table public.subscriptions add column if not exists cancel_at_period_end   boolean not null default false;
alter table public.subscriptions add column if not exists created_at             timestamptz not null default now();

-- price_id predates stripe_price_id; keep both populated for compatibility.
create index if not exists subscriptions_customer_idx     on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_sub_idx   on public.subscriptions (stripe_subscription_id);
create index if not exists subscriptions_status_idx       on public.subscriptions (status);

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- ══ 3. qr_codes — how the code is encoded / tracked ═════════════
--   hosted   : QR encodes /q/{slug}  (tracked)
--   redirect : QR encodes /r/{slug} → 302 destination_url (tracked)
--   direct   : QR encodes the external URL itself (not tracked)
--   native   : QR encodes a WIFI:/vCard payload (not trackable)
alter table public.qr_codes add column if not exists tracking_mode text not null default 'hosted';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'qr_codes_tracking_mode_check'
  ) then
    alter table public.qr_codes
      add constraint qr_codes_tracking_mode_check
      check (tracking_mode in ('hosted', 'redirect', 'direct', 'native'));
  end if;
end;
$$;

-- Hot path for the quota count (active = published) and dashboards.
create index if not exists qr_codes_user_status_idx on public.qr_codes (user_id, status);

-- ══ 4. qr_scan_events — one row per real scan ═══════════════════
create table if not exists public.qr_scan_events (
  id               uuid primary key default gen_random_uuid(),
  qr_code_id       uuid not null references public.qr_codes (id) on delete cascade,
  scanned_at       timestamptz not null default now(),
  country          text,
  region           text,
  city             text,
  device_type      text,   -- mobile | tablet | desktop | bot | unknown
  browser          text,
  operating_system text,
  referrer         text,
  visitor_hash     text,   -- one-way hash (ip+ua+day+secret); never a raw IP
  is_bot           boolean not null default false
);

alter table public.qr_scan_events enable row level security;

-- Owner may read scan events for their own QR codes. No one lists them
-- anonymously; no end-user INSERT/UPDATE/DELETE (service role records them).
drop policy if exists "qr_scan_events_select_own" on public.qr_scan_events;
create policy "qr_scan_events_select_own" on public.qr_scan_events
  for select using (
    exists (
      select 1 from public.qr_codes c
      where c.id = qr_scan_events.qr_code_id and c.user_id = auth.uid()
    )
  );

create index if not exists qr_scan_events_qr_time_idx  on public.qr_scan_events (qr_code_id, scanned_at desc);
create index if not exists qr_scan_events_qr_bot_idx   on public.qr_scan_events (qr_code_id, is_bot);
create index if not exists qr_scan_events_visitor_idx  on public.qr_scan_events (qr_code_id, visitor_hash);

-- ══ 5. stripe_webhook_events — idempotency ledger ══════════════
create table if not exists public.stripe_webhook_events (
  event_id     text primary key,
  event_type   text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
-- No policies at all → only the service role (webhook) can touch it.

-- ══ 6. Plan / quota functions ═══════════════════════════════════

-- The caller's most relevant subscription (active/trialing wins, then latest).
create or replace function public.get_user_plan_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_unlimited boolean;
  v_active_count int;
begin
  if v_uid is null then
    return jsonb_build_object('plan', 'anonymous', 'is_unlimited', false, 'active_count', 0, 'limit', 3);
  end if;

  select * into v_sub
  from public.subscriptions
  where user_id = v_uid
  order by (status in ('active', 'trialing')) desc,
           current_period_end desc nulls last,
           updated_at desc
  limit 1;

  v_unlimited := coalesce(v_sub.status in ('active', 'trialing'), false);

  select count(*) into v_active_count
  from public.qr_codes
  where user_id = v_uid and status = 'published';

  return jsonb_build_object(
    'plan',                 case when v_unlimited then 'pro' else 'free' end,
    'status',               v_sub.status,
    'is_unlimited',         v_unlimited,
    'active_count',         v_active_count,
    'limit',                case when v_unlimited then null else 3 end,
    'can_create',           v_unlimited or v_active_count < 3,
    'current_period_end',   v_sub.current_period_end,
    'cancel_at_period_end', coalesce(v_sub.cancel_at_period_end, false),
    'price_id',             v_sub.stripe_price_id
  );
end;
$$;

-- Atomically decide whether a QR may become active and, if so, flip it
-- to published. Per-user advisory lock closes the race where two
-- concurrent publishes could push a free account past the limit.
create or replace function public.try_activate_qr(p_qr_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.qr_codes%rowtype;
  v_unlimited boolean;
  v_active_count int;
begin
  if v_uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  end if;

  -- Serialize all activation decisions for this user.
  perform pg_advisory_xact_lock(hashtext(v_uid::text)::bigint);

  select * into v_row from public.qr_codes where id = p_qr_id;
  if not found or v_row.user_id <> v_uid then
    return jsonb_build_object('allowed', false, 'reason', 'not_found');
  end if;

  -- Already active → editing/republishing never consumes a new slot.
  if v_row.status = 'published' then
    return jsonb_build_object('allowed', true, 'reason', 'already_active');
  end if;

  v_unlimited := exists (
    select 1 from public.subscriptions
    where user_id = v_uid and status in ('active', 'trialing')
  );

  if not v_unlimited then
    select count(*) into v_active_count
    from public.qr_codes
    where user_id = v_uid and status = 'published';

    if v_active_count >= 3 then
      return jsonb_build_object(
        'allowed', false, 'reason', 'quota_exceeded',
        'active_count', v_active_count, 'limit', 3, 'plan', 'free'
      );
    end if;
  end if;

  -- Signal the guard trigger that THIS activation went through the quota check.
  perform set_config('app.qr_activating', 'on', true);

  update public.qr_codes
     set status = 'published',
         published_at = coalesce(published_at, now())
   where id = p_qr_id;

  return jsonb_build_object('allowed', true, 'reason', 'activated');
end;
$$;

-- Guard: status → 'published' is allowed ONLY through try_activate_qr (which
-- sets app.qr_activating). A direct client PATCH to status='published' — the
-- PostgREST bypass — is rejected, so the free-tier quota can't be evaded.
create or replace function public.enforce_publish_via_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published'
     and old.status is distinct from 'published'
     and coalesce(current_setting('app.qr_activating', true), '') <> 'on' then
    raise exception 'Publishing must go through try_activate_qr (quota enforcement).'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists qr_codes_enforce_publish on public.qr_codes;
create trigger qr_codes_enforce_publish
  before update on public.qr_codes
  for each row execute procedure public.enforce_publish_via_quota();

-- ══ 7. Analytics functions (owner-scoped) ═══════════════════════

-- Per-QR analytics. Bots excluded from every count. Ownership enforced.
create or replace function public.get_qr_scan_summary(p_qr_id uuid, p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_days int := greatest(1, least(coalesce(p_days, 30), 3650));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_daily_start timestamptz;
  v_result jsonb;
begin
  if v_uid is null or not exists (
    select 1 from public.qr_codes where id = p_qr_id and user_id = v_uid
  ) then
    return jsonb_build_object('authorized', false);
  end if;

  -- Start the daily series at the first real scan in-window so long
  -- ranges (e.g. "all time") don't emit thousands of empty leading days.
  select greatest(date_trunc('day', v_since), date_trunc('day', coalesce(min(scanned_at), now())))
  into v_daily_start
  from public.qr_scan_events e
  where e.qr_code_id = p_qr_id and not e.is_bot and e.scanned_at >= v_since;

  select jsonb_build_object(
    'authorized',   true,
    'total',        (select count(*) from public.qr_scan_events e where e.qr_code_id = p_qr_id and not e.is_bot),
    'unique',       (select count(distinct visitor_hash) from public.qr_scan_events e where e.qr_code_id = p_qr_id and not e.is_bot),
    'today',        (select count(*) from public.qr_scan_events e where e.qr_code_id = p_qr_id and not e.is_bot and e.scanned_at >= date_trunc('day', now())),
    'last_7d',      (select count(*) from public.qr_scan_events e where e.qr_code_id = p_qr_id and not e.is_bot and e.scanned_at >= now() - interval '7 days'),
    'last_30d',     (select count(*) from public.qr_scan_events e where e.qr_code_id = p_qr_id and not e.is_bot and e.scanned_at >= now() - interval '30 days'),
    'window_total', (select count(*) from public.qr_scan_events e where e.qr_code_id = p_qr_id and not e.is_bot and e.scanned_at >= v_since),
    'last_scanned', (select max(scanned_at) from public.qr_scan_events e where e.qr_code_id = p_qr_id and not e.is_bot),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('date', to_char(d.day, 'YYYY-MM-DD'), 'count', coalesce(c.n, 0)) order by d.day), '[]'::jsonb)
      from generate_series(v_daily_start, date_trunc('day', now()), interval '1 day') as d(day)
      left join (
        select date_trunc('day', scanned_at) as day, count(*) as n
        from public.qr_scan_events e
        where e.qr_code_id = p_qr_id and not e.is_bot and e.scanned_at >= v_since
        group by 1
      ) c on c.day = d.day
    ),
    'countries', public._scan_breakdown(p_qr_id, 'country', v_since),
    'devices',   public._scan_breakdown(p_qr_id, 'device_type', v_since),
    'browsers',  public._scan_breakdown(p_qr_id, 'browser', v_since),
    'referrers', public._scan_breakdown(p_qr_id, 'referrer', v_since)
  ) into v_result;

  return v_result;
end;
$$;

-- Top-10 breakdown for a single dimension (internal helper).
create or replace function public._scan_breakdown(p_qr_id uuid, p_dim text, p_since timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_result jsonb;
begin
  execute format($q$
    select coalesce(jsonb_agg(jsonb_build_object('key', k, 'count', n) order by n desc), '[]'::jsonb)
    from (
      select coalesce(nullif(%I, ''), 'Unknown') as k, count(*) as n
      from public.qr_scan_events e
      where e.qr_code_id = $1 and not e.is_bot and e.scanned_at >= $2
      group by 1
      order by n desc
      limit 10
    ) t
  $q$, p_dim)
  into v_result
  using p_qr_id, p_since;
  return v_result;
end;
$$;

-- Account-wide overview for the dashboard home.
create or replace function public.get_user_scan_overview()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_top record;
begin
  if v_uid is null then
    return jsonb_build_object('total_scans', 0, 'scans_30d', 0, 'active_count', 0);
  end if;

  select c.id, c.name, count(e.*) as scans into v_top
  from public.qr_codes c
  left join public.qr_scan_events e on e.qr_code_id = c.id and not e.is_bot
  where c.user_id = v_uid and c.status <> 'archived'
  group by c.id, c.name
  order by scans desc
  limit 1;

  return jsonb_build_object(
    'total_scans', (
      select count(*) from public.qr_scan_events e
      join public.qr_codes c on c.id = e.qr_code_id
      where c.user_id = v_uid and not e.is_bot
    ),
    'scans_30d', (
      select count(*) from public.qr_scan_events e
      join public.qr_codes c on c.id = e.qr_code_id
      where c.user_id = v_uid and not e.is_bot and e.scanned_at >= now() - interval '30 days'
    ),
    'active_count', (
      select count(*) from public.qr_codes where user_id = v_uid and status = 'published'
    ),
    'most_scanned', case when v_top.id is not null and v_top.scans > 0
      then jsonb_build_object('id', v_top.id, 'name', v_top.name, 'scans', v_top.scans)
      else null end
  );
end;
$$;

-- ══ 8. Grants — lock down, then hand out execute ════════════════
revoke all on function public.get_user_plan_status()          from public;
revoke all on function public.try_activate_qr(uuid)           from public;
revoke all on function public.get_qr_scan_summary(uuid, int)  from public;
revoke all on function public._scan_breakdown(uuid, text, timestamptz) from public;
revoke all on function public.get_user_scan_overview()        from public;

grant execute on function public.get_user_plan_status()         to authenticated;
grant execute on function public.try_activate_qr(uuid)          to authenticated;
grant execute on function public.get_qr_scan_summary(uuid, int) to authenticated;
grant execute on function public.get_user_scan_overview()       to authenticated;
-- _scan_breakdown is called only from within other definer functions; no direct grant.

-- ══ 9. Per-QR scan summaries for the "My QR Codes" list ═════════
create or replace function public.get_user_qr_summaries()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', c.id,
      'scans', s.scans,
      'unique_scans', s.uniq,
      'last_scanned', s.last
    )),
    '[]'::jsonb
  )
  from public.qr_codes c
  left join lateral (
    select
      count(*) filter (where not e.is_bot) as scans,
      count(distinct e.visitor_hash) filter (where not e.is_bot) as uniq,
      max(e.scanned_at) as last
    from public.qr_scan_events e
    where e.qr_code_id = c.id
  ) s on true
  where c.user_id = auth.uid();
$$;

revoke all on function public.get_user_qr_summaries() from public;
grant execute on function public.get_user_qr_summaries() to authenticated;
