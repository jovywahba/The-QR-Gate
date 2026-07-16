# Halfstack Template

The opinionated starter every Halfstack product is born from. **Copy this whole folder** to start a new app, then edit one config file and fill in content.

> Read `/CLAUDE.md` (portfolio law) and `/docs/` (engineering, brand, marketing) first.

## What's inside

- **Next 15 (App Router) + React 19 + TypeScript**
- **Tailwind v4** (CSS-first) + **shadcn/ui** (new-york / stone / 0.5rem), pre-themed to **Halfstack Design System v2.0**
- **Supabase** auth (email + password) + RLS-first SQL migrations
- **Stripe** Checkout with a card-required free trial + verified webhooks + billing portal
- **Resend** transactional email (shared account, per-app API key)
- **Vercel Analytics + Speed Insights**
- Marketing site (landing, pricing, **`<Incumbent>` alternative / comparison pages**), **blog**, **docs**, **status**, legal stubs
- Product shell (sidebar + topbar) with `dashboard / settings / billing`

## The one file you always edit: `lib/site.ts`

Brand name, domain, tagline, pricing, the incumbent, and comparison data all live in `lib/site.ts`. The marketing site, pricing page, comparison/alternative pages, footer, and metadata read from it — so configuring a new app is mostly **editing one typed object**.

## Start a new app

```bash
# from the repo root, after provisioning the 5 accounts (see CLAUDE.md §6)
cp -R _template <codename>
cd <codename>
pnpm install
cp .env.example .env.local         # fill from the Apple Note / dashboards
pnpm dlx shadcn@latest add dialog dropdown-menu tabs table sonner   # add more UI as needed
pnpm dev
```

Then: edit `lib/site.ts`, write the product, run the lifecycle checklist in `PROJECT.md`, and create the Vercel project (Root Directory = `<codename>`).

## Database

SQL migrations live in `supabase/migrations/`. Link the project and push:

```bash
pnpm dlx supabase link --project-ref <ref>
pnpm db:push
```

Every table **must** have RLS enabled (see `0000_init.sql` for the pattern).

## Local Stripe webhooks

```bash
pnpm stripe:listen   # prints a whsec_… — put it in STRIPE_WEBHOOK_SECRET
```

## Hard gates before launch

See `PROJECT.md` → "Launch" and `CLAUDE.md` §10. No secrets in git, RLS on every table, verified webhooks, live keys in prod, ToS + Privacy live.
