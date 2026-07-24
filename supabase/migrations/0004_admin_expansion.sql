-- ───────────────────────────────────────────────────────────────
-- The QR Gate — Part 8: admin platform + moderation primitives.
--
-- RLS-first (hard gate §10). Idempotent: safe to run once on top of
-- 0000 → 0003. Everything privileged is a SECURITY DEFINER function
-- that RE-CHECKS admin membership internally (defense in depth — the
-- app guard is not the only gate). Admin tables are never writable by
-- end users; presence/audit/entitlement rows are written ONLY through
-- these definer functions.
--
-- ⚠️ BOOTSTRAP THE FIRST ADMIN (do this once, by hand, after running):
--   insert into public.admin_memberships (user_id, role, is_active)
--   values ('<YOUR-AUTH-USER-UUID>', 'super_admin', true)
--   on conflict (user_id) do update set role = 'super_admin', is_active = true;
--   -- find your UUID: select id from auth.users where email = 'you@example.com';
--   -- Do NOT commit a real UUID to git.
-- ───────────────────────────────────────────────────────────────

-- ══ 1. profiles — account suspension ════════════════════════════
alter table public.profiles add column if not exists suspended_at     timestamptz;
alter table public.profiles add column if not exists suspended_reason text;

-- Suspension must not be self-clearable. profiles has an owner UPDATE policy
-- (needed for the Settings display-name), which would otherwise let a
-- suspended user NULL out their own suspended_at via a raw PostgREST call.
-- Restrict end-user updates to display fields only; suspended_at is written
-- exclusively by the admin SECURITY DEFINER path (runs as the table owner).
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ══ 2. qr_codes — paused status + moderation columns ════════════
alter table public.qr_codes add column if not exists paused_at    timestamptz;
alter table public.qr_codes add column if not exists pause_reason text;
-- Set when an admin pauses/archives for moderation. While true, the OWNER
-- cannot re-activate the QR (try_activate_qr refuses) — only an admin can lift it.
alter table public.qr_codes add column if not exists moderation_locked boolean not null default false;

-- Extend the status check to include 'paused' (drop + re-add; idempotent).
do $$
begin
  alter table public.qr_codes drop constraint if exists qr_codes_status_check;
  alter table public.qr_codes
    add constraint qr_codes_status_check
    check (status in ('draft', 'published', 'archived', 'paused'));
end;
$$;

-- ══ 2b. Close the INSERT quota bypass ══════════════════════════
-- The Part-5 publish guard was UPDATE-only, so a direct INSERT with
-- status='published' skipped try_activate_qr entirely — letting a free
-- user mint unlimited live QRs via a raw PostgREST insert. Fire the guard
-- on INSERT too, and forbid inserting a published row via RLS. Every
-- legitimate publish INSERTs a draft first and then UPDATEs through
-- try_activate_qr, so nothing real inserts a published row.
create or replace function public.enforce_publish_via_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and coalesce(current_setting('app.qr_activating', true), '') <> 'on' then
    raise exception 'Publishing must go through try_activate_qr (quota enforcement).'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists qr_codes_enforce_publish on public.qr_codes;
create trigger qr_codes_enforce_publish
  before insert or update on public.qr_codes
  for each row execute procedure public.enforce_publish_via_quota();

drop policy if exists "qr_codes_insert_own" on public.qr_codes;
create policy "qr_codes_insert_own" on public.qr_codes
  for insert with check (auth.uid() = user_id and status <> 'published');

-- ══ 3. admin_memberships — who is an admin, and as what ═════════
create table if not exists public.admin_memberships (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('super_admin', 'admin', 'support', 'analyst')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);
alter table public.admin_memberships enable row level security;

-- ══ 4. admin_audit_logs — append-only privileged-action ledger ══
create table if not exists public.admin_audit_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id),
  action        text not null,
  target_type   text,
  target_id     text,
  reason        text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
alter table public.admin_audit_logs enable row level security;
create index if not exists admin_audit_created_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_admin_idx   on public.admin_audit_logs (admin_user_id, created_at desc);
create index if not exists admin_audit_target_idx  on public.admin_audit_logs (target_type, target_id);

-- ══ 5. user_presence — privacy-conscious "online now" ═══════════
-- No raw IP, no raw session token; session_hash is an opaque per-tab id.
create table if not exists public.user_presence (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  session_hash   text,
  route_category text,
  last_seen_at   timestamptz not null default now()
);
alter table public.user_presence enable row level security;
create index if not exists user_presence_last_seen_idx on public.user_presence (last_seen_at desc);

-- ══ 6. complimentary_entitlements — admin-granted Pro ══════════
-- Stored SEPARATELY from Stripe state; never overwrites a real subscription.
create table if not exists public.complimentary_entitlements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  plan       text not null default 'pro' check (plan in ('pro')),
  reason     text,
  granted_by uuid references auth.users (id),
  expires_at timestamptz,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.complimentary_entitlements enable row level security;
create index if not exists comp_entitlements_user_idx on public.complimentary_entitlements (user_id, is_active);

-- ══ 7. Admin identity helpers (definer — no RLS recursion) ═════
-- The caller's active admin role, or null. SECURITY DEFINER so RLS
-- policies can call it without recursively hitting admin_memberships.
create or replace function public.current_admin_role()
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select role from public.admin_memberships
  where user_id = auth.uid() and is_active = true
  limit 1;
$$;

create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.admin_memberships
    where user_id = auth.uid() and is_active = true
  );
$$;

-- Does the caller's role satisfy one of the allowed roles? Raises 'forbidden'
-- (used by mutating RPCs as a hard internal gate, independent of the app).
create or replace function public._require_admin(p_roles text[])
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public.current_admin_role();
begin
  if v_role is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not (v_role = any(p_roles)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return v_role;
end;
$$;

-- ══ 8. RLS policies for the admin tables ═══════════════════════
-- These SELECT policies mirror the app permission matrix (roles.ts) so the
-- fine-grained model can't be bypassed by talking to PostgREST directly.
-- Only super_admin/admin may enumerate the admin roster or read moderation/
-- entitlement reasons; support/analyst are aggregate-only.
drop policy if exists admin_memberships_select on public.admin_memberships;
create policy admin_memberships_select on public.admin_memberships
  for select using (public.current_admin_role() in ('super_admin', 'admin'));

-- Audit log (view_audit = admin/super only). Append-only (no write policy).
drop policy if exists admin_audit_select on public.admin_audit_logs;
create policy admin_audit_select on public.admin_audit_logs
  for select using (public.current_admin_role() in ('super_admin', 'admin'));

-- Presence: any active admin may read (used in overview/user list); own row.
drop policy if exists user_presence_select on public.user_presence;
create policy user_presence_select on public.user_presence
  for select using (public.is_active_admin() or user_id = auth.uid());

-- Entitlements (manage_entitlements = admin/super); a user reads their own.
drop policy if exists comp_entitlements_select on public.complimentary_entitlements;
create policy comp_entitlements_select on public.complimentary_entitlements
  for select using (public.current_admin_role() in ('super_admin', 'admin') or user_id = auth.uid());
-- (No insert/update/delete policies anywhere above → only SECURITY DEFINER
--  functions and the service role can write these tables.)

-- ══ 9. Presence heartbeat (throttled upsert) ═══════════════════
create or replace function public.touch_presence(p_session_hash text, p_route_category text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.user_presence (user_id, session_hash, route_category, last_seen_at)
  values (auth.uid(), left(coalesce(p_session_hash, ''), 64), left(coalesce(p_route_category, 'Dashboard'), 32), now())
  on conflict (user_id) do update
    set session_hash   = excluded.session_hash,
        route_category = excluded.route_category,
        last_seen_at   = now();
end;
$$;

-- ══ 10. Plan status — honor complimentary entitlements ═════════
-- Re-defines the Part-5 function: Pro is granted by an active Stripe sub
-- OR an active (unexpired) complimentary entitlement. Active count excludes
-- archived AND paused rows (both free a slot).
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
  v_sub_unlimited boolean;
  v_comp boolean;
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

  v_sub_unlimited := coalesce(v_sub.status in ('active', 'trialing'), false);
  v_comp := exists (
    select 1 from public.complimentary_entitlements
    where user_id = v_uid and is_active = true
      and (expires_at is null or expires_at > now())
  );
  v_unlimited := v_sub_unlimited or v_comp;

  select count(*) into v_active_count
  from public.qr_codes
  where user_id = v_uid and status = 'published';

  return jsonb_build_object(
    'plan',                 case when v_unlimited then 'pro' else 'free' end,
    'status',               v_sub.status,
    'is_unlimited',         v_unlimited,
    'complimentary',        v_comp,
    'active_count',         v_active_count,
    'limit',                case when v_unlimited then null else 3 end,
    'can_create',           v_unlimited or v_active_count < 3,
    'current_period_end',   v_sub.current_period_end,
    'cancel_at_period_end', coalesce(v_sub.cancel_at_period_end, false),
    'price_id',             v_sub.stripe_price_id
  );
end;
$$;

-- Also let the atomic activation gate honor complimentary Pro.
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

  -- A suspended account cannot (re)publish — closes the post-ban token window
  -- where unpause/restore could re-serve content the suspension took down.
  if exists (select 1 from public.profiles where id = v_uid and suspended_at is not null) then
    return jsonb_build_object('allowed', false, 'reason', 'suspended');
  end if;

  perform pg_advisory_xact_lock(hashtext(v_uid::text)::bigint);

  select * into v_row from public.qr_codes where id = p_qr_id;
  if not found or v_row.user_id <> v_uid then
    return jsonb_build_object('allowed', false, 'reason', 'not_found');
  end if;

  -- An admin-moderated QR can only be lifted by an admin, not the owner.
  if v_row.moderation_locked then
    return jsonb_build_object('allowed', false, 'reason', 'moderation_locked');
  end if;

  if v_row.status = 'published' then
    return jsonb_build_object('allowed', true, 'reason', 'already_active');
  end if;

  v_unlimited := exists (
    select 1 from public.subscriptions
    where user_id = v_uid and status in ('active', 'trialing')
  ) or exists (
    select 1 from public.complimentary_entitlements
    where user_id = v_uid and is_active = true
      and (expires_at is null or expires_at > now())
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

  perform set_config('app.qr_activating', 'on', true);

  update public.qr_codes
     set status = 'published',
         paused_at = null,
         pause_reason = null,
         published_at = coalesce(published_at, now())
   where id = p_qr_id;

  return jsonb_build_object('allowed', true, 'reason', 'activated');
end;
$$;

-- ══ 11. Audit writer (internal; admin-gated) ═══════════════════
create or replace function public.admin_log(
  p_action text, p_target_type text, p_target_id text, p_reason text, p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, nullif(p_reason, ''), coalesce(p_metadata, '{}'::jsonb));
end;
$$;

-- ══ 12. Admin overview — real aggregate metrics (read-only) ════
-- Any active admin may read. Values that aren't tracked are returned as
-- null so the UI can show an honest "unavailable" instead of a fake 0.
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
    'total_scans',       (select count(*) from public.qr_scan_events where not is_bot),
    'scans_today',       (select count(*) from public.qr_scan_events where not is_bot and scanned_at >= date_trunc('day', now())),
    'scans_30d',         (select count(*) from public.qr_scan_events where not is_bot and scanned_at >= now() - interval '30 days'),
    'bot_scans_30d',     (select count(*) from public.qr_scan_events where is_bot and scanned_at >= now() - interval '30 days'),
    'pro_accounts',      (
      select count(distinct u) from (
        select user_id as u from public.subscriptions where status in ('active','trialing')
        union
        select user_id from public.complimentary_entitlements where is_active = true and (expires_at is null or expires_at > now())
      ) x
    ),
    'presence_by_route', (
      select coalesce(jsonb_object_agg(route_category, n), '{}'::jsonb) from (
        select coalesce(route_category, 'Unknown') as route_category, count(*) as n
        from public.user_presence where last_seen_at >= v_online_cut group by 1
      ) r
    )
  );
end;
$$;

-- ══ 13. Admin: paginated user list (read-only, admin-gated) ════
create or replace function public.admin_list_users(
  p_search text default null, p_filter text default 'all', p_limit int default 50, p_offset int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_cut timestamptz := now() - interval '5 minutes';
  v_q text := nullif(trim(coalesce(p_search, '')), '');
begin
  -- Analyst is aggregate-only (no per-user list / private detail).
  perform public._require_admin(array['super_admin','admin','support']);

  return coalesce((
    select jsonb_agg(row_to_json(t)) from (
      select
        p.id, p.email, p.full_name, p.avatar_url, p.created_at,
        (p.suspended_at is not null) as suspended,
        (pr.last_seen_at is not null and pr.last_seen_at >= v_cut) as online,
        pr.last_seen_at,
        (exists (select 1 from public.subscriptions s where s.user_id = p.id and s.status in ('active','trialing'))
          or exists (select 1 from public.complimentary_entitlements c where c.user_id = p.id and c.is_active and (c.expires_at is null or c.expires_at > now()))) as is_pro,
        (select count(*) from public.qr_codes q where q.user_id = p.id) as qr_total,
        (select count(*) from public.qr_codes q where q.user_id = p.id and q.status = 'published') as qr_active
      from public.profiles p
      left join public.user_presence pr on pr.user_id = p.id
      where (v_q is null or p.email ilike '%'||v_q||'%' or coalesce(p.full_name,'') ilike '%'||v_q||'%' or p.id::text = v_q)
        and (
          p_filter = 'all'
          or (p_filter = 'online' and pr.last_seen_at >= v_cut)
          or (p_filter = 'suspended' and p.suspended_at is not null)
          or (p_filter = 'new' and p.created_at >= date_trunc('month', now()))
          or (p_filter = 'pro' and (exists (select 1 from public.subscriptions s where s.user_id = p.id and s.status in ('active','trialing')) or exists (select 1 from public.complimentary_entitlements c where c.user_id = p.id and c.is_active and (c.expires_at is null or c.expires_at > now()))))
          or (p_filter = 'free' and not (exists (select 1 from public.subscriptions s where s.user_id = p.id and s.status in ('active','trialing')) or exists (select 1 from public.complimentary_entitlements c where c.user_id = p.id and c.is_active and (c.expires_at is null or c.expires_at > now()))))
          or (p_filter = 'over_limit' and (select count(*) from public.qr_codes q where q.user_id = p.id and q.status='published') > 3)
        )
      order by p.created_at desc
      limit greatest(1, least(coalesce(p_limit, 50), 200))
      offset greatest(0, coalesce(p_offset, 0))
    ) t
  ), '[]'::jsonb);
end;
$$;

-- ══ 13b. Admin mutations — atomic, self-auditing, role-gated ═══
-- Pause / unpause / archive a QR as an admin. Unpause sets the activation
-- flag so the publish-guard trigger allows it (admin override — the free
-- quota is NOT re-checked for an admin action; noted for the audit trail).
create or replace function public.admin_set_qr_status(p_qr_id uuid, p_status text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public._require_admin(array['super_admin','admin']);
begin
  if p_status not in ('paused','published','archived') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  if p_status = 'published' then
    -- Admin lifts the moderation hold and re-publishes (override; audited).
    perform set_config('app.qr_activating', 'on', true);
    update public.qr_codes
      set status = 'published', paused_at = null, pause_reason = null,
          moderation_locked = false,
          published_at = coalesce(published_at, now())
      where id = p_qr_id;
  elsif p_status = 'paused' then
    update public.qr_codes
      set status = 'paused', paused_at = now(), pause_reason = nullif(p_reason, ''),
          moderation_locked = true
      where id = p_qr_id;
  else
    update public.qr_codes set status = 'archived', moderation_locked = true where id = p_qr_id;
  end if;
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), 'qr.'||p_status, 'qr_code', p_qr_id::text, nullif(p_reason,''), jsonb_build_object('role', v_role));
end;
$$;

-- Suspend / reactivate an account (sets the DB flag + audits). The auth-side
-- ban and session revocation happen in the server action via the admin API.
create or replace function public.admin_set_suspension(p_user_id uuid, p_suspend boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public._require_admin(array['super_admin','admin']);
begin
  update public.profiles
    set suspended_at = case when p_suspend then now() else null end,
        suspended_reason = case when p_suspend then nullif(p_reason,'') else null end
    where id = p_user_id;
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), case when p_suspend then 'user.suspend' else 'user.reactivate' end,
          'user', p_user_id::text, nullif(p_reason,''), jsonb_build_object('role', v_role));
end;
$$;

-- Grant / revoke complimentary Pro (separate from Stripe; never overwrites it).
create or replace function public.admin_grant_comp(p_user_id uuid, p_reason text, p_expires timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public._require_admin(array['super_admin','admin']);
begin
  update public.complimentary_entitlements set is_active = false where user_id = p_user_id and is_active = true;
  insert into public.complimentary_entitlements (user_id, plan, reason, granted_by, expires_at, is_active)
  values (p_user_id, 'pro', nullif(p_reason,''), auth.uid(), p_expires, true);
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), 'entitlement.grant', 'user', p_user_id::text, nullif(p_reason,''),
          jsonb_build_object('role', v_role, 'expires_at', p_expires));
end;
$$;

create or replace function public.admin_revoke_comp(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := public._require_admin(array['super_admin','admin']);
begin
  update public.complimentary_entitlements set is_active = false where user_id = p_user_id and is_active = true;
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), 'entitlement.revoke', 'user', p_user_id::text, nullif(p_reason,''), jsonb_build_object('role', v_role));
end;
$$;

-- Manage admin team membership (SUPER ADMIN ONLY).
create or replace function public.admin_grant_role(p_user_id uuid, p_role text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._require_admin(array['super_admin']);
  if p_role not in ('super_admin','admin','support','analyst','none') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot change your own role' using errcode = '42501';
  end if;
  if p_role = 'none' then
    update public.admin_memberships set is_active = false where user_id = p_user_id;
  else
    insert into public.admin_memberships (user_id, role, is_active, created_by)
    values (p_user_id, p_role, true, auth.uid())
    on conflict (user_id) do update set role = excluded.role, is_active = true;
  end if;
  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), 'admin.role_'||p_role, 'user', p_user_id::text, nullif(p_reason,''), '{}'::jsonb);
end;
$$;

-- ══ 14. Grants — lock down, then hand execute to authenticated ══
revoke all on function public.current_admin_role()                       from public;
revoke all on function public.is_active_admin()                          from public;
revoke all on function public.touch_presence(text, text)                 from public;
revoke all on function public.admin_log(text, text, text, text, jsonb)   from public;
revoke all on function public.get_admin_overview()                       from public;
revoke all on function public.admin_list_users(text, text, int, int)     from public;
revoke all on function public.admin_set_qr_status(uuid, text, text)      from public;
revoke all on function public.admin_set_suspension(uuid, boolean, text)  from public;
revoke all on function public.admin_grant_comp(uuid, text, timestamptz)  from public;
revoke all on function public.admin_revoke_comp(uuid, text)              from public;
revoke all on function public.admin_grant_role(uuid, text, text)         from public;

grant execute on function public.current_admin_role()                    to authenticated;
grant execute on function public.is_active_admin()                       to authenticated;
grant execute on function public.touch_presence(text, text)              to authenticated;
-- admin_log is internally gated by is_active_admin(); grant so server actions
-- (e.g. the audited password-reset) can write their audit row on the session.
grant execute on function public.admin_log(text, text, text, text, jsonb) to authenticated;
grant execute on function public.get_admin_overview()                    to authenticated;
grant execute on function public.admin_list_users(text, text, int, int)  to authenticated;
grant execute on function public.admin_set_qr_status(uuid, text, text)     to authenticated;
grant execute on function public.admin_set_suspension(uuid, boolean, text) to authenticated;
grant execute on function public.admin_grant_comp(uuid, text, timestamptz) to authenticated;
grant execute on function public.admin_revoke_comp(uuid, text)             to authenticated;
grant execute on function public.admin_grant_role(uuid, text, text)        to authenticated;
-- admin_log + _require_admin are called only from within other definer
-- functions / server actions; no broad grant needed.

-- Rollback note: to remove this expansion, drop the four new tables and
-- the functions above, then re-add the 3-value qr_codes status check. The
-- profiles/qr_codes columns are additive and safe to leave.
