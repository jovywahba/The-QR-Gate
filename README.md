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
4. [`supabase/SUPABASE_PRODUCT_FEATURES.sql`](supabase/SUPABASE_PRODUCT_FEATURES.sql) — scheduling, folders, tags, version history, notifications (migration `0005`).

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

### QR destination model — direct vs hosted vs tracked

| Mode | Types | What the QR encodes | Public page? |
|------|-------|--------------------|--------------|
| **Direct** | Website, Facebook, Instagram, URL-mode Video/MP3/Menu | the external URL itself | no — opens the destination |
| **Native** | WiFi, vCard, WhatsApp | a `WIFI:` / vCard / `wa.me` payload | no — triggers the native action |
| **Hosted** | PDF, List of Links, Business, Images, Social, Apps, Coupon, upload-mode Video/MP3, PDF/rich Menu | `https://…/q/[slug]` | yes — a The QR Gate scan page (`components/qr-public/*`, wrapped in `PublicShell`) |
| **Tracked** | any direct type with scan tracking on | `https://…/r/[slug]` → 302 | no (redirects), scans counted |

**Design preview (Step 3):** the QR editor always renders a real, scannable
QR while you design — direct/native types use their real payload; hosted and
tracked types (which have no `/q|/r/[slug]` until publish) render a safe
**design-preview payload** (`https://www.theqrgate.com/design-preview`, an
owned URL — never localhost, never a guessed slug). It is render-only: the
**Download stays blocked for hosted types until publish**, and the moment
publishing succeeds the code swaps to the real `/q/[slug]` (design unchanged).
See `lib/qr/preview-payload.ts`. One composition pipeline
(`lib/qr/composition.ts`) drives every preview and every PNG/SVG export, so
what you see is exactly what downloads.

## Deploy

The repository root is the Next.js app — Vercel detects it automatically.
Set the environment variables from `.env.example` in the Vercel project and
point `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` at the production domain
so published QR codes encode the right origin.

**Stripe (Live vs Sandbox):** Vercel **Production must use Live keys**
(`sk_live_…`); a test key in production makes billing "unconfigured" and will
not charge (enforced in `lib/stripe/config.ts`). Preview / Development /
`.env.local` use Sandbox/Test keys. Verify the Live config safely at
[`/api/health/stripe`](https://www.theqrgate.com/api/health/stripe) — it returns
correctness booleans only (price active / USD / $10 / monthly / product name /
live-mode), never a key, id, or payload.
