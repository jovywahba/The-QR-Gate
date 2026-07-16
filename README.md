# The QR Gate

Create, customize, and share QR codes — 16 QR types, a four-step builder
(Select QR Type → Add Content → Design QR Code → Download QR Code), real
hosted `/q/[slug]` pages, and PNG/SVG export.

The application lives in [`online-qr-generator/`](online-qr-generator/).

## Quick start

```bash
cd online-qr-generator
pnpm install
cp .env.example .env.local   # fill in your values — NEVER commit this file
pnpm dev
```

## Supabase setup

1. Create a Supabase project.
2. Run [`online-qr-generator/supabase/SUPABASE_FULL_SETUP.sql`](online-qr-generator/supabase/SUPABASE_FULL_SETUP.sql)
   once in the Supabase SQL Editor (idempotent — safe to re-run).
3. Put the project URL, anon key, and service-role key in `online-qr-generator/.env.local`.
4. Verify the live security posture: `pnpm verify:supabase`.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Direct QR types (Website, WhatsApp, WiFi, vCard, Facebook, Instagram, and
URL-mode Video/MP3/Menu) work with no backend at all; hosted types publish
through Supabase.
