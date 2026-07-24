-- ───────────────────────────────────────────────────────────────
-- The QR Gate — Part 9: product features.
--   • Scheduling (start/end/timezone/fallback) on hosted & tracked QRs
--   • Organization: folders + tags
--   • Version history snapshots
--   • Owner notifications (first-scan celebration)
--
-- RLS-first, idempotent, additive. Runs on top of 0000 → 0004.
-- ───────────────────────────────────────────────────────────────

-- ══ 1. qr_codes — scheduling + folder ═══════════════════════════
alter table public.qr_codes add column if not exists starts_at    timestamptz;
alter table public.qr_codes add column if not exists ends_at      timestamptz;
alter table public.qr_codes add column if not exists timezone     text;
alter table public.qr_codes add column if not exists fallback_url text;
alter table public.qr_codes add column if not exists folder_id    uuid;

create index if not exists qr_codes_folder_idx on public.qr_codes (folder_id);

-- ══ 2. qr_folders — owner-scoped organization ═══════════════════
create table if not exists public.qr_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
alter table public.qr_folders enable row level security;
create index if not exists qr_folders_user_idx on public.qr_folders (user_id);

drop policy if exists qr_folders_all_own on public.qr_folders;
create policy qr_folders_all_own on public.qr_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Link qr_codes.folder_id now that the table exists (best-effort; skip if present).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'qr_codes_folder_fk') then
    alter table public.qr_codes
      add constraint qr_codes_folder_fk foreign key (folder_id)
      references public.qr_folders (id) on delete set null;
  end if;
end;
$$;

-- ══ 3. qr_tags + qr_code_tags ═══════════════════════════════════
create table if not exists public.qr_tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.qr_tags enable row level security;
create index if not exists qr_tags_user_idx on public.qr_tags (user_id);

drop policy if exists qr_tags_all_own on public.qr_tags;
create policy qr_tags_all_own on public.qr_tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.qr_code_tags (
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  tag_id     uuid not null references public.qr_tags (id) on delete cascade,
  primary key (qr_code_id, tag_id)
);
alter table public.qr_code_tags enable row level security;

-- A user may link/unlink a tag to a QR only when BOTH the QR and the tag are theirs.
drop policy if exists qr_code_tags_all_own on public.qr_code_tags;
create policy qr_code_tags_all_own on public.qr_code_tags
  for all
  using (
    exists (select 1 from public.qr_codes c where c.id = qr_code_id and c.user_id = auth.uid())
    and exists (select 1 from public.qr_tags t where t.id = tag_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.qr_codes c where c.id = qr_code_id and c.user_id = auth.uid())
    and exists (select 1 from public.qr_tags t where t.id = tag_id and t.user_id = auth.uid())
  );

-- ══ 4. qr_versions — immutable-ish snapshots ════════════════════
create table if not exists public.qr_versions (
  id              uuid primary key default gen_random_uuid(),
  qr_code_id      uuid not null references public.qr_codes (id) on delete cascade,
  version         int not null,
  content         jsonb not null default '{}'::jsonb,
  design          jsonb not null default '{}'::jsonb,
  destination_url text,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id),
  unique (qr_code_id, version)
);
alter table public.qr_versions enable row level security;
create index if not exists qr_versions_qr_idx on public.qr_versions (qr_code_id, version desc);

-- Owner may READ their versions. Rows are written only by the definer RPC
-- below (no direct insert/update/delete policy → append-only for users).
drop policy if exists qr_versions_select_own on public.qr_versions;
create policy qr_versions_select_own on public.qr_versions
  for select using (
    exists (select 1 from public.qr_codes c where c.id = qr_code_id and c.user_id = auth.uid())
  );

-- Snapshot the current state of a QR the caller owns (called after publish).
create or replace function public.snapshot_qr_version(p_qr_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.qr_codes%rowtype;
  v_next int;
begin
  if v_uid is null then return; end if;
  select * into v_row from public.qr_codes where id = p_qr_id and user_id = v_uid;
  if not found then return; end if;

  select coalesce(max(version), 0) + 1 into v_next from public.qr_versions where qr_code_id = p_qr_id;

  -- Skip a duplicate snapshot if the LATEST version already matches.
  if exists (
    select 1 from public.qr_versions v
    where v.qr_code_id = p_qr_id
      and v.version = v_next - 1
      and v.content = v_row.content and v.design = v_row.design
      and coalesce(v.destination_url, '') = coalesce(v_row.destination_url, '')
  ) then
    return;
  end if;

  insert into public.qr_versions (qr_code_id, version, content, design, destination_url, created_by)
  values (p_qr_id, v_next, v_row.content, v_row.design, v_row.destination_url, v_uid);
end;
$$;

revoke all on function public.snapshot_qr_version(uuid) from public;
grant execute on function public.snapshot_qr_version(uuid) to authenticated;

-- ══ 5. user_notifications — first-scan celebration + more ═══════
create table if not exists public.user_notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null,
  qr_code_id uuid references public.qr_codes (id) on delete cascade,
  title      text not null,
  body       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table public.user_notifications enable row level security;
create index if not exists user_notifications_unread_idx on public.user_notifications (user_id, read_at, created_at desc);
-- At most one first-scan celebration per QR (the recorder inserts ON CONFLICT DO NOTHING).
create unique index if not exists user_notifications_first_scan_uniq
  on public.user_notifications (qr_code_id)
  where type = 'first_scan';

-- Owner may read + mark-read their own notifications. Rows are INSERTED only
-- by the service role (the scan recorder) — no user insert policy.
drop policy if exists user_notifications_select_own on public.user_notifications;
create policy user_notifications_select_own on public.user_notifications
  for select using (auth.uid() = user_id);

drop policy if exists user_notifications_update_own on public.user_notifications;
create policy user_notifications_update_own on public.user_notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Rollback note: drop the four tables + the snapshot function; the qr_codes
-- columns are additive and safe to leave.
