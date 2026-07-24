# The QR Gate

Create, customize, and share QR codes — 16 QR types, a four-step builder
(Select QR Type → Add Content → Design QR Code → Download QR Code), real
hosted `/q/[slug]` pages, and PNG/SVG export.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in your values — NEVER commit this file
pnpm dev
```

## Supabase setup

Run these in the Supabase SQL Editor, in order (each is idempotent — safe to re-run):

1. [`supabase/SUPABASE_FULL_SETUP.sql`](supabase/SUPABASE_FULL_SETUP.sql) — core schema, RLS, storage.
2. [`supabase/SUPABASE_AUTH_BILLING_ANALYTICS.sql`](supabase/SUPABASE_AUTH_BILLING_ANALYTICS.sql) — auth profiles, billing, scan analytics (migrations `0002`+`0003`).
3. [`supabase/SUPABASE_PRODUCT_ADMIN_EXPANSION.sql`](supabase/SUPABASE_PRODUCT_ADMIN_EXPANSION.sql) — admin platform, presence, pause/suspend/entitlements (migration `0004`).

Then:

4. Put the project URL, anon key, and service-role key in `.env.local`.
5. Verify the live security posture: `pnpm verify:supabase`.

### Bootstrap the first admin

After step 3, grant yourself super-admin **once** (find your UUID with
`select id from auth.users where email = 'you@example.com';`):

```sql
insert into public.admin_memberships (user_id, role, is_active)
values ('<YOUR-AUTH-USER-UUID>', 'super_admin', true)
on conflict (user_id) do update set role = 'super_admin', is_active = true;
```

Then reload the app — an **Admin panel** link appears in your account menu (`/admin`).
Never commit a real UUID.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Direct QR types (Website, WhatsApp, WiFi, vCard, Facebook, Instagram, and
URL-mode Video/MP3/Menu) work with no backend at all; hosted types publish
through Supabase.

## Deploy

The repository root is the Next.js app — Vercel detects it automatically.
Set the environment variables from `.env.example` in the Vercel project and
point `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` at the production domain
so published QR codes encode the right origin.
