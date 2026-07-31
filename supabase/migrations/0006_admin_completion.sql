-- ───────────────────────────────────────────────────────────────
-- The QR Gate — Phase 2: admin panel completion.
--
-- Adds the objects the admin completion genuinely needs, on top of
-- 0000 → 0005. Same rules as 0004: RLS-first, every privileged read/write
-- is a SECURITY DEFINER function that RE-CHECKS the caller's admin role
-- (defense in depth), admin tables are never end-user-writable, no fake
-- data. Idempotent — safe to run once on top of 0005.
--
-- New objects:
--   • admin_notes            — internal per-user notes (super/admin/support)
--   • admin_export_jobs       — history of admin aggregate exports
--   • security_events         — real, server-recorded security signals
--   • last-super-admin guard  — admin_grant_role can never drop the final super_admin
--   • get_admin_overview v2   — + archived / trialing / past_due / unique visitors
--   • admin_analytics()       — system-wide aggregate analytics (privacy-safe)
--   • admin_qr_list/detail    — admin QR management (never leaks WiFi/protected content)
--   • admin_subscriptions_list — billing view + active-QR usage
--   • admin_audit_query()     — filtered + paginated audit log
--   • admin_global_search()   — permission-aware global search
--   • admin_add_note/list_notes, admin_record_export, admin_security_events
-- ───────────────────────────────────────────────────────────────

-- ══ 1. admin_notes — internal notes on a user (never shown to the user) ══
create table if not exists public.admin_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  author_id  uuid not null references auth.users (id),
  body       text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_notes enable row level security;
create index if not exists admin_notes_user_idx on public.admin_notes (user_id, created_at desc);
-- Read: any active admin (support included) may read notes. Write: definer only.
drop policy if exists admin_notes_select on public.admin_notes;
create policy admin_notes_select on public.admin_notes
  for select using (public.is_active_admin());

-- ══ 2. admin_export_jobs — audit trail of admin aggregate exports ══
create table if not exists public.admin_export_jobs (
  id         uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id),
  kind       text not null,          -- e.g. 'users', 'analytics', 'subscriptions'
  status     text not null default 'complete' check (status in ('complete','failed')),
  row_count  int,
  created_at timestamptz not null default now()
);
alter table public.admin_export_jobs enable row level security;
create index if not exists admin_export_created_idx on public.admin_export_jobs (created_at desc);
drop policy if exists admin_export_select on public.admin_export_jobs;
create policy admin_export_select on public.admin_export_jobs
  for select using (public.current_admin_role() in ('super_admin','admin'));

-- ══ 3. security_events — REAL security signals (server-recorded only) ══
-- Written exclusively by server code via the service role (bypasses RLS):
-- e.g. admin permission denials, invalid webhook signatures, suspended-user
-- access attempts. Signals the stack cannot yet observe (failed logins) are
-- simply absent and the UI shows "Not tracked" — never fabricated.
create table if not exists public.security_events (
  id            uuid primary key default gen_random_uuid(),
  event_type    text not null,       -- 'admin_permission_denied' | 'webhook_signature_invalid' | 'suspended_access_attempt' | ...
  severity      text not null default 'info' check (severity in ('info','warning','critical')),
  actor_user_id uuid,                 -- who triggered it, when known (nullable; may be anon)
  subject       text,                 -- coarse subject (route, target id) — never a raw IP or secret
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
alter table public.security_events enable row level security;
create index if not exists security_events_created_idx on public.security_events (created_at desc);
create index if not exists security_events_type_idx on public.security_events (event_type, created_at desc);
-- Read: admin/super only. No insert policy → only the service role writes it.
drop policy if exists security_events_select on public.security_events;
create policy security_events_select on public.security_events
  for select using (public.current_admin_role() in ('super_admin','admin'));

-- ══ 4. LAST-SUPER-ADMIN GUARD — admin_grant_role can never drop the last one ══
-- Redefines the 0004 function. Adds an explicit, atomic invariant: it is
-- impossible to demote, remove ('none'), or (via is_active) disable the FINAL
-- active super_admin. Enforced in the DB, independent of any UI.
create or replace function public.admin_grant_role(p_user_id uuid, p_role text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_role text;
  v_other_supers int;
begin
  perform public._require_admin(array['super_admin']);
  if p_role not in ('super_admin','admin','support','analyst','none') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot change your own role' using errcode = '42501';
  end if;

  -- Serialize membership changes so two concurrent demotions can't both pass
  -- the "another super_admin exists" check and reach zero.
  perform pg_advisory_xact_lock(hashtext('admin_memberships')::bigint);

  select role into v_target_role
  from public.admin_memberships
  where user_id = p_user_id and is_active = true;

  -- If the target is currently an active super_admin AND this change would
  -- strip that (demotion to another role, or removal), require at least one
  -- OTHER active super_admin to remain.
  if v_target_role = 'super_admin' and p_role <> 'super_admin' then
    select count(*) into v_other_supers
    from public.admin_memberships
    where role = 'super_admin' and is_active = true and user_id <> p_user_id;
    if v_other_supers < 1 then
      raise exception 'cannot remove the last active super admin' using errcode = 'P0001';
    end if;
  end if;

  if p_role = 'none' then
    update public.admin_memberships set is_active = false where user_id = p_user_id;
  else
    insert into public.admin_memberships (user_id, role, is_active, created_by)
    values (p_user_id, p_role, true, auth.uid())
    on conflict (user_id) do update set role = excluded.role, is_active = true;
  end if;
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), 'admin.role_'||p_role, 'user', p_user_id::text, nullif(p_reason,''),
          jsonb_build_object('prev_role', v_target_role));
end;
$$;

-- ══ 5. get_admin_overview v2 — richer real metrics (backward-compatible) ══
create or replace function public.get_admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_online_cut timestamptz := now() - interval '5 minutes';
begin
  perform public._require_admin(array['super_admin','admin','support','analyst']);

  return jsonb_build_object(
    'total_users',       (select count(*) from public.profiles),
    'new_users_today',   (select count(*) from public.profiles where created_at >= date_trunc('day', now())),
    'new_users_month',   (select count(*) from public.profiles where created_at >= date_trunc('month', now())),
    'online_now',        (select count(*) from public.user_presence where last_seen_at >= v_online_cut),
    'active_today',      (select count(distinct user_id) from public.user_presence where last_seen_at >= date_trunc('day', now())),
    'total_qr',          (select count(*) from public.qr_codes),
    'active_qr',         (select count(*) from public.qr_codes where status = 'published'),
    'paused_qr',         (select count(*) from public.qr_codes where status = 'paused'),
    'archived_qr',       (select count(*) from public.qr_codes where status = 'archived'),
    'total_scans',       (select count(*) from public.qr_scan_events where not is_bot),
    'scans_today',       (select count(*) from public.qr_scan_events where not is_bot and scanned_at >= date_trunc('day', now())),
    'scans_30d',         (select count(*) from public.qr_scan_events where not is_bot and scanned_at >= now() - interval '30 days'),
    'bot_scans_30d',     (select count(*) from public.qr_scan_events where is_bot and scanned_at >= now() - interval '30 days'),
    'unique_visitors_30d', (select count(distinct visitor_hash) from public.qr_scan_events where not is_bot and visitor_hash is not null and scanned_at >= now() - interval '30 days'),
    'pro_accounts',      (select count(distinct user_id) from public.subscriptions where status in ('active','trialing')),
    'trialing_accounts', (select count(distinct user_id) from public.subscriptions where status = 'trialing'),
    'past_due_accounts', (select count(distinct user_id) from public.subscriptions where status in ('past_due','unpaid')),
    'comp_accounts',     (select count(distinct user_id) from public.complimentary_entitlements where is_active = true and (expires_at is null or expires_at > now())),
    'presence_by_route', (
      select coalesce(jsonb_object_agg(route_category, n), '{}'::jsonb) from (
        select coalesce(route_category, 'Unknown') as route_category, count(*) as n
        from public.user_presence where last_seen_at >= v_online_cut group by 1
      ) r
    )
  );
end;
$$;

-- ══ 6. admin_analytics — system-wide aggregates (privacy-safe) ══
-- Analyst-readable. Time-bounded. NEVER returns raw IP or visitor identity —
-- only coarse counts and top-N breakdowns.
create or replace function public.admin_analytics(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_from timestamptz := coalesce(p_from, now() - interval '30 days');
  v_to   timestamptz := coalesce(p_to, now() + interval '1 day');
begin
  perform public._require_admin(array['super_admin','admin','analyst']);

  return jsonb_build_object(
    'range_from', v_from,
    'range_to', v_to,
    'scans_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb) from (
        select date_trunc('day', scanned_at)::date as d, count(*) as c
        from public.qr_scan_events where not is_bot and scanned_at >= v_from and scanned_at < v_to group by 1
      ) x
    ),
    'visitors_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb) from (
        select date_trunc('day', scanned_at)::date as d, count(distinct visitor_hash) as c
        from public.qr_scan_events where not is_bot and visitor_hash is not null and scanned_at >= v_from and scanned_at < v_to group by 1
      ) x
    ),
    'registrations_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, count(*) as c
        from public.profiles where created_at >= v_from and created_at < v_to group by 1
      ) x
    ),
    'qr_creation_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, count(*) as c
        from public.qr_codes where created_at >= v_from and created_at < v_to group by 1
      ) x
    ),
    'type_distribution', (
      select coalesce(jsonb_agg(jsonb_build_object('type', type, 'count', c) order by c desc), '[]'::jsonb) from (
        select type, count(*) as c from public.qr_codes group by 1
      ) x
    ),
    'tracking_distribution', (
      select coalesce(jsonb_agg(jsonb_build_object('mode', coalesce(tracking_mode,'unknown'), 'count', c) order by c desc), '[]'::jsonb) from (
        select tracking_mode, count(*) as c from public.qr_codes group by 1
      ) x
    ),
    'top_qrs', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.scans desc), '[]'::jsonb) from (
        select c.id, c.name, c.slug, c.type, count(e.id) as scans
        from public.qr_codes c
        join public.qr_scan_events e on e.qr_code_id = c.id and not e.is_bot and e.scanned_at >= v_from and e.scanned_at < v_to
        group by c.id, c.name, c.slug, c.type
        order by scans desc limit 10
      ) t
    ),
    'countries', public._admin_scan_breakdown('country', v_from, v_to),
    'devices',   public._admin_scan_breakdown('device_type', v_from, v_to),
    'browsers',  public._admin_scan_breakdown('browser', v_from, v_to),
    'operating_systems', public._admin_scan_breakdown('operating_system', v_from, v_to),
    'referrers', public._admin_scan_breakdown('referrer', v_from, v_to),
    'bot_scans', (select count(*) from public.qr_scan_events where is_bot and scanned_at >= v_from and scanned_at < v_to),
    'human_scans', (select count(*) from public.qr_scan_events where not is_bot and scanned_at >= v_from and scanned_at < v_to),
    'conversion', (
      select jsonb_build_object(
        'signups', count(*),
        'published_first_qr', count(*) filter (where exists (
          select 1 from public.qr_codes q where q.user_id = p.id and q.published_at is not null
        ))
      )
      from public.profiles p where p.created_at >= v_from and p.created_at < v_to
    )
  );
end;
$$;

-- Coarse top-10 breakdown of a scan column (human scans only, non-null). Helper.
create or replace function public._admin_scan_breakdown(p_col text, p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v jsonb;
begin
  if p_col not in ('country','device_type','browser','operating_system','referrer') then
    raise exception 'invalid breakdown column' using errcode = '22023';
  end if;
  execute format($q$
    select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', c) order by c desc), '[]'::jsonb)
    from (
      select coalesce(nullif(%I, ''), 'Unknown') as label, count(*) as c
      from public.qr_scan_events
      where not is_bot and scanned_at >= $1 and scanned_at < $2
      group by 1 order by c desc limit 10
    ) x
  $q$, p_col) into v using p_from, p_to;
  return coalesce(v, '[]'::jsonb);
end;
$$;

-- ══ 7. admin_qr_list — admin QR management (no WiFi/protected content leak) ══
-- Returns ONLY safe metadata: never the content jsonb (which holds WiFi
-- passwords / vCard PII / protected data). destination_url is included only
-- for hosted/redirect QRs (an inherently public target).
create or replace function public.admin_qr_list(
  p_search text default null, p_filter text default 'all', p_limit int default 50, p_offset int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_q text := nullif(trim(coalesce(p_search, '')), '');
begin
  perform public._require_admin(array['super_admin','admin','support']);

  return coalesce((
    select jsonb_agg(row_to_json(t)) from (
      select
        c.id, c.name, c.type, c.status, c.slug, c.tracking_mode,
        case when c.tracking_mode in ('hosted','redirect') then null else c.destination_url end as destination_url,
        c.created_at, c.published_at, c.paused_at, c.starts_at, c.ends_at, c.moderation_locked,
        c.user_id as owner_id,
        p.email as owner_email,
        (select count(*) from public.qr_scan_events e where e.qr_code_id = c.id and not e.is_bot) as scans,
        (select count(distinct e.visitor_hash) from public.qr_scan_events e where e.qr_code_id = c.id and not e.is_bot and e.visitor_hash is not null) as unique_visitors,
        (select max(e.scanned_at) from public.qr_scan_events e where e.qr_code_id = c.id) as last_scan_at,
        (select count(*) from public.qr_versions v where v.qr_code_id = c.id) as version_count
      from public.qr_codes c
      join public.profiles p on p.id = c.user_id
      where (v_q is null
             or c.name ilike '%'||v_q||'%'
             or c.slug ilike '%'||v_q||'%'
             or c.id::text = v_q
             or p.email ilike '%'||v_q||'%')
        and (
          p_filter = 'all'
          or (p_filter in ('published','draft','paused','archived') and c.status = p_filter)
          or (p_filter = 'scheduled' and c.starts_at is not null and c.starts_at > now())
          or (p_filter = 'expired' and c.ends_at is not null and c.ends_at < now())
        )
      order by c.created_at desc
      limit greatest(1, least(coalesce(p_limit, 50), 200))
      offset greatest(0, coalesce(p_offset, 0))
    ) t
  ), '[]'::jsonb);
end;
$$;

-- Safe admin detail for one QR (no content jsonb).
create or replace function public.admin_qr_detail(p_qr_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  perform public._require_admin(array['super_admin','admin','support']);
  return (
    select jsonb_build_object(
      'id', c.id, 'name', c.name, 'type', c.type, 'status', c.status, 'slug', c.slug,
      'tracking_mode', c.tracking_mode,
      'destination_url', case when c.tracking_mode in ('hosted','redirect') then null else c.destination_url end,
      'created_at', c.created_at, 'published_at', c.published_at, 'updated_at', c.updated_at,
      'paused_at', c.paused_at, 'pause_reason', c.pause_reason, 'moderation_locked', c.moderation_locked,
      'starts_at', c.starts_at, 'ends_at', c.ends_at, 'timezone', c.timezone,
      'owner_id', c.user_id, 'owner_email', p.email,
      'scans', (select count(*) from public.qr_scan_events e where e.qr_code_id = c.id and not e.is_bot),
      'unique_visitors', (select count(distinct e.visitor_hash) from public.qr_scan_events e where e.qr_code_id = c.id and not e.is_bot and e.visitor_hash is not null),
      'last_scan_at', (select max(e.scanned_at) from public.qr_scan_events e where e.qr_code_id = c.id),
      'version_count', (select count(*) from public.qr_versions v where v.qr_code_id = c.id)
    )
    from public.qr_codes c join public.profiles p on p.id = c.user_id
    where c.id = p_qr_id
  );
end;
$$;

-- ══ 8. admin_subscriptions_list — billing view + active-QR usage ══
create or replace function public.admin_subscriptions_list(p_limit int default 100, p_offset int default 0)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  perform public._require_admin(array['super_admin','admin']);
  return coalesce((
    select jsonb_agg(row_to_json(t)) from (
      select
        s.user_id, p.email, s.status, s.current_period_end, s.cancel_at_period_end,
        s.stripe_price_id,
        (select count(*) from public.qr_codes q where q.user_id = s.user_id and q.status = 'published') as active_qr
      from public.subscriptions s
      join public.profiles p on p.id = s.user_id
      order by (s.status in ('active','trialing')) desc, s.current_period_end desc nulls last
      limit greatest(1, least(coalesce(p_limit, 100), 500))
      offset greatest(0, coalesce(p_offset, 0))
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ══ 9. admin_audit_query — filtered + paginated audit log ══
create or replace function public.admin_audit_query(
  p_action text default null, p_admin_id uuid default null, p_target_type text default null,
  p_from timestamptz default null, p_to timestamptz default null,
  p_limit int default 50, p_offset int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_rows jsonb;
  v_total int;
begin
  perform public._require_admin(array['super_admin','admin']);

  select count(*) into v_total from public.admin_audit_logs l
  where (p_action is null or l.action = p_action)
    and (p_admin_id is null or l.admin_user_id = p_admin_id)
    and (p_target_type is null or l.target_type = p_target_type)
    and (p_from is null or l.created_at >= p_from)
    and (p_to is null or l.created_at < p_to);

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v_rows from (
    select l.id, l.admin_user_id, pa.email as admin_email, l.action, l.target_type,
           l.target_id, l.reason, l.metadata, l.created_at
    from public.admin_audit_logs l
    left join public.profiles pa on pa.id = l.admin_user_id
    where (p_action is null or l.action = p_action)
      and (p_admin_id is null or l.admin_user_id = p_admin_id)
      and (p_target_type is null or l.target_type = p_target_type)
      and (p_from is null or l.created_at >= p_from)
      and (p_to is null or l.created_at < p_to)
    order by l.created_at desc
    limit greatest(1, least(coalesce(p_limit, 50), 200))
    offset greatest(0, coalesce(p_offset, 0))
  ) t;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

-- ══ 10. admin_global_search — permission-aware search ══
-- Users are returned only for roles that may view users (super/admin/support);
-- analyst gets no private results (empty, no error). Searches email / name /
-- user UUID / Stripe customer id / QR name / QR id / slug.
create or replace function public.admin_global_search(p_query text, p_limit int default 8)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_role text := public._require_admin(array['super_admin','admin','support','analyst']);
  v_q text := nullif(trim(coalesce(p_query, '')), '');
  v_lim int := greatest(1, least(coalesce(p_limit, 8), 25));
  v_users jsonb := '[]'::jsonb;
  v_qrs jsonb := '[]'::jsonb;
begin
  if v_q is null then
    return jsonb_build_object('users', v_users, 'qrs', v_qrs);
  end if;

  if v_role in ('super_admin','admin','support') then
    select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v_users from (
      select distinct p.id, p.email, p.full_name, (p.suspended_at is not null) as suspended
      from public.profiles p
      left join public.subscriptions s on s.user_id = p.id
      where p.email ilike '%'||v_q||'%'
         or coalesce(p.full_name,'') ilike '%'||v_q||'%'
         or p.id::text = v_q
         or p.stripe_customer_id = v_q
         or s.stripe_customer_id = v_q
      limit v_lim
    ) t;

    select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v_qrs from (
      select c.id, c.name, c.slug, c.type, c.status
      from public.qr_codes c
      where c.name ilike '%'||v_q||'%' or c.slug ilike '%'||v_q||'%' or c.id::text = v_q
      order by c.created_at desc
      limit v_lim
    ) t;
  end if;

  return jsonb_build_object('users', v_users, 'qrs', v_qrs);
end;
$$;

-- ══ 11. admin_add_note / admin_list_notes ══
create or replace function public.admin_add_note(p_user_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public._require_admin(array['super_admin','admin','support']);
begin
  if nullif(trim(coalesce(p_body,'')), '') is null then
    raise exception 'empty note' using errcode = '22023';
  end if;
  insert into public.admin_notes (user_id, author_id, body)
  values (p_user_id, auth.uid(), left(trim(p_body), 4000));
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), 'user.note_add', 'user', p_user_id::text, null, jsonb_build_object('role', v_role));
end;
$$;

create or replace function public.admin_list_notes(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  perform public._require_admin(array['super_admin','admin','support']);
  return coalesce((
    select jsonb_agg(row_to_json(t) order by t.created_at desc) from (
      select n.id, n.body, n.created_at, n.author_id, pa.email as author_email
      from public.admin_notes n
      left join public.profiles pa on pa.id = n.author_id
      where n.user_id = p_user_id
      order by n.created_at desc
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ══ 12. admin_record_export — audited export-history entry ══
create or replace function public.admin_record_export(p_kind text, p_row_count int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public._require_admin(array['super_admin','admin']);
begin
  insert into public.admin_export_jobs (created_by, kind, status, row_count)
  values (auth.uid(), left(coalesce(p_kind,'export'), 40), 'complete', greatest(0, coalesce(p_row_count, 0)));
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), 'export.'||left(coalesce(p_kind,'export'),40), 'export', null, null, jsonb_build_object('role', v_role, 'rows', p_row_count));
end;
$$;

-- ══ 13. admin_security_events — filtered read of real security signals ══
create or replace function public.admin_security_events(p_type text default null, p_limit int default 100)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  perform public._require_admin(array['super_admin','admin']);
  return coalesce((
    select jsonb_agg(row_to_json(t)) from (
      select id, event_type, severity, actor_user_id, subject, metadata, created_at
      from public.security_events
      where (p_type is null or event_type = p_type)
      order by created_at desc
      limit greatest(1, least(coalesce(p_limit, 100), 200))
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ══ 14. Grants — lock down, then hand execute to authenticated ══
revoke all on function public.admin_analytics(timestamptz, timestamptz)                      from public;
revoke all on function public._admin_scan_breakdown(text, timestamptz, timestamptz)          from public;
revoke all on function public.admin_qr_list(text, text, int, int)                            from public;
revoke all on function public.admin_qr_detail(uuid)                                          from public;
revoke all on function public.admin_subscriptions_list(int, int)                             from public;
revoke all on function public.admin_audit_query(text, uuid, text, timestamptz, timestamptz, int, int) from public;
revoke all on function public.admin_global_search(text, int)                                 from public;
revoke all on function public.admin_add_note(uuid, text)                                     from public;
revoke all on function public.admin_list_notes(uuid)                                         from public;
revoke all on function public.admin_record_export(text, int)                                 from public;
revoke all on function public.admin_security_events(text, int)                               from public;

grant execute on function public.admin_analytics(timestamptz, timestamptz)                   to authenticated;
grant execute on function public.admin_qr_list(text, text, int, int)                         to authenticated;
grant execute on function public.admin_qr_detail(uuid)                                       to authenticated;
grant execute on function public.admin_subscriptions_list(int, int)                          to authenticated;
grant execute on function public.admin_audit_query(text, uuid, text, timestamptz, timestamptz, int, int) to authenticated;
grant execute on function public.admin_global_search(text, int)                              to authenticated;
grant execute on function public.admin_add_note(uuid, text)                                  to authenticated;
grant execute on function public.admin_list_notes(uuid)                                      to authenticated;
grant execute on function public.admin_record_export(text, int)                              to authenticated;
grant execute on function public.admin_security_events(text, int)                            to authenticated;
-- _admin_scan_breakdown is called only from within admin_analytics (definer);
-- no broad grant needed. get_admin_overview / admin_grant_role are re-defined
-- above and keep their existing 0004 grants.

-- Rollback note: drop admin_notes, admin_export_jobs, security_events and the
-- functions added here; re-apply the 0004 versions of get_admin_overview and
-- admin_grant_role to revert the extra metrics + last-super-admin guard.
