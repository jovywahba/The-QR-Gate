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

1. Create a Supabase project.
2. Run [`supabase/SUPABASE_FULL_SETUP.sql`](supabase/SUPABASE_FULL_SETUP.sql)
   once in the Supabase SQL Editor (idempotent — safe to re-run).
3. Put the project URL, anon key, and service-role key in `.env.local`.
4. Verify the live security posture: `pnpm verify:supabase`.

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
