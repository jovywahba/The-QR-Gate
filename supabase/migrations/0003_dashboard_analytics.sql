-- ───────────────────────────────────────────────────────────────
-- The QR Gate — Part 7: dashboard analytics upgrade.
--
-- Additive + idempotent. Runs on top of 0000 → 0002. Everything here
-- is `create or replace` on already-owner-scoped, security-definer
-- functions, so re-running is safe and it never touches data or RLS.
--
-- What it adds, all still bots-excluded and ownership-enforced:
--   • get_user_scan_overview()  → account-wide UNIQUE visitors +
--     a richer "most scanned" (type / unique / last scanned).
--   • get_user_scan_activity(p_days) → a daily scan/unique series for
--     the dashboard activity chart (7 / 30 / 90 / all-time).
--   • get_qr_scan_summary(p_qr_id, p_days) → operating-system
--     breakdown + a privacy-safe "recent scans" feed (no IP, no
--     visitor hash — only coarse device/geo signals).
-- ───────────────────────────────────────────────────────────────

-- ══ 1. Account-wide overview (adds unique visitors + rich top QR) ══
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
    return jsonb_build_object(
      'total_scans', 0, 'unique_visitors', 0, 'scans_30d', 0,
      'active_count', 0, 'most_scanned', null
    );
  end if;

  -- Highest-scanning non-archived QR, with its unique + last-scan detail.
  select c.id, c.name, c.type,
         count(e.id) filter (where not e.is_bot)                     as scans,
         count(distinct e.visitor_hash) filter (where not e.is_bot)  as uniq,
         max(e.scanned_at) filter (where not e.is_bot)               as last
  into v_top
  from public.qr_codes c
  left join public.qr_scan_events e on e.qr_code_id = c.id
  where c.user_id = v_uid and c.status <> 'archived'
  group by c.id, c.name, c.type
  order by scans desc nulls last
  limit 1;

  return jsonb_build_object(
    'total_scans', (
      select count(*) from public.qr_scan_events e
      join public.qr_codes c on c.id = e.qr_code_id
      where c.user_id = v_uid and not e.is_bot
    ),
    'unique_visitors', (
      select count(distinct e.visitor_hash) from public.qr_scan_events e
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
    'most_scanned', case when v_top.id is not null and coalesce(v_top.scans, 0) > 0
      then jsonb_build_object(
        'id', v_top.id, 'name', v_top.name, 'type', v_top.type,
        'scans', v_top.scans, 'unique', v_top.uniq, 'last_scanned', v_top.last
      )
      else null end
  );
end;
$$;

-- ══ 2. Daily activity series for the dashboard chart ════════════
-- Account-wide (across all the caller's QR codes), bots excluded.
create or replace function public.get_user_scan_activity(p_days int default 30)
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
  v_start timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('total', 0, 'unique', 0, 'daily', '[]'::jsonb);
  end if;

  -- Begin the series at the first real scan in-window so "all time" doesn't
  -- emit thousands of empty leading days.
  select greatest(date_trunc('day', v_since), date_trunc('day', coalesce(min(e.scanned_at), now())))
  into v_start
  from public.qr_scan_events e
  join public.qr_codes c on c.id = e.qr_code_id
  where c.user_id = v_uid and not e.is_bot and e.scanned_at >= v_since;

  return jsonb_build_object(
    'total', (
      select count(*) from public.qr_scan_events e
      join public.qr_codes c on c.id = e.qr_code_id
      where c.user_id = v_uid and not e.is_bot and e.scanned_at >= v_since
    ),
    'unique', (
      select count(distinct e.visitor_hash) from public.qr_scan_events e
      join public.qr_codes c on c.id = e.qr_code_id
      where c.user_id = v_uid and not e.is_bot and e.scanned_at >= v_since
    ),
    'daily', (
      select coalesce(
        jsonb_agg(jsonb_build_object(
          'date', to_char(d.day, 'YYYY-MM-DD'),
          'count', coalesce(x.n, 0),
          'unique', coalesce(x.u, 0)
        ) order by d.day),
        '[]'::jsonb
      )
      from generate_series(v_start, date_trunc('day', now()), interval '1 day') as d(day)
      left join (
        select date_trunc('day', e.scanned_at) as day,
               count(*) as n,
               count(distinct e.visitor_hash) as u
        from public.qr_scan_events e
        join public.qr_codes c on c.id = e.qr_code_id
        where c.user_id = v_uid and not e.is_bot and e.scanned_at >= v_since
        group by 1
      ) x on x.day = d.day
    )
  );
end;
$$;

-- ══ 3. Per-QR summary — add OS breakdown + privacy-safe recent feed ══
-- Full re-definition of the Part-5 function with two new keys. Ownership
-- is enforced up front; bots are excluded from every count; the recent
-- feed exposes only coarse signals (never IP, never the visitor hash).
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
    'countries',         public._scan_breakdown(p_qr_id, 'country', v_since),
    'devices',           public._scan_breakdown(p_qr_id, 'device_type', v_since),
    'browsers',          public._scan_breakdown(p_qr_id, 'browser', v_since),
    'operating_systems', public._scan_breakdown(p_qr_id, 'operating_system', v_since),
    'referrers',         public._scan_breakdown(p_qr_id, 'referrer', v_since),
    'recent', (
      select coalesce(jsonb_agg(r), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'scanned_at',       e.scanned_at,
          'device_type',      e.device_type,
          'browser',          e.browser,
          'operating_system', e.operating_system,
          'country',          e.country,
          'referrer',         e.referrer
        ) as r
        from public.qr_scan_events e
        where e.qr_code_id = p_qr_id and not e.is_bot
        order by e.scanned_at desc
        limit 15
      ) recent_rows
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ══ 4. Grants — lock down, then hand execute to authenticated ════
revoke all on function public.get_user_scan_overview()          from public;
revoke all on function public.get_user_scan_activity(int)       from public;
revoke all on function public.get_qr_scan_summary(uuid, int)    from public;

grant execute on function public.get_user_scan_overview()       to authenticated;
grant execute on function public.get_user_scan_activity(int)    to authenticated;
grant execute on function public.get_qr_scan_summary(uuid, int) to authenticated;
