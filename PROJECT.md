# online-qr-generator — PROJECT

> One app's registry + lifecycle checklist. Copy this with the template; fill it in as you go.
> **No secrets in this file** — only non-secret IDs and pointers. See `CLAUDE.md` §13.

## Snapshot

| Field | Value |
|-------|-------|
| Codename (internal) | `online-qr-generator` |
| Public brand | The QR Gate |
| Incumbent | QR Code Generator PRO (Bitly, qr-code-generator.com) |
| One-line pitch | Real, scannable QR codes — 16 types, 4 steps, half the price |
| Owner | Jovy |
| Stage | `4 Polish` (Parts 1–5 + account dashboard built & deployed; live-verified) |
| Live URL | https://the-qr-gate.vercel.app |

> ⚠️ **DB action required for analytics/dashboard:** apply
> `supabase/migrations/0003_dashboard_analytics.sql` (or paste
> `supabase/SUPABASE_DASHBOARD_ANALYTICS.sql`) in the Supabase SQL Editor.
> It's additive + idempotent (only `create or replace` on the analytics
> functions). Until it runs, the dashboard degrades gracefully — Unique
> Visitors shows "—" and the daily-activity chart shows an honest
> "warming up" state instead of a fabricated graph.

## Pricing (record the claim — keep it honest)

| | Incumbent | Halfstack |
|---|-----------|-------|
| Headline price | ⚠️ TODO — verify at qr-code-generator.com/pricing with a dated source | _~1/2, rounded clean — set after verification_ |
| Source + date | _TODO · YYYY-MM-DD_ | — |

## Account registry (non-secret pointers only — passwords live in the Apple Note)

| Account | Value |
|---------|-------|
| Gmail | `halfstack.<codename>@gmail.com` |
| Supabase project ref | — |
| Supabase project URL | — |
| Supabase plan | Free / Pro |
| Domain | — |
| Registrar | — |
| Stripe account id | `acct_…` (in the Halfstack org) |
| Vercel project | — (Root Directory = `<codename>`) |

---

## Lifecycle checklist

### 0 · Idea
- [ ] Incumbent chosen
- [ ] "Core 80%" hypothesis written (the features 95% of users actually pay for)
- [ ] Row added to `/PROJECTS.md`

### 1 · Scoped
- [ ] Feature-parity list written (from public docs — no copied assets)
- [ ] Pricing set (~1/2) and recorded above with source + date
- [ ] Public brand name + domain chosen (original, Halfstack-owned — see CLAUDE.md §12)

### 2 · Provisioned
- [ ] Gmail created
- [ ] Supabase account + project created under that Gmail; ref/URL recorded
- [ ] Domain purchased; registrar recorded
- [ ] Stripe account created in the Halfstack org; `acct_…` recorded
- [ ] App copied from `_template`; `pnpm install` clean
- [ ] Vercel project created (Root Directory = `<codename>`), domain attached, env vars set
- [ ] First deploy is green
- [ ] All creds saved to the shared Apple Note

### 3 · Building
- [ ] Auth: sign-up / sign-in / sign-out / reset all work
- [ ] Database schema + migrations; **RLS enabled on every table**
- [ ] Core product features built (the scoped 80%)
- [ ] Stripe Checkout/Billing wired; access granted from **verified webhooks**
- [ ] App wears the Halfstack design system (tokens, ink primary, rationed blue)

### 4 · Polish
- [ ] Content configured: `lib/site.ts` (brand, pricing, incumbent, comparison, alternatives) + `lib/landing.ts` (features, steps, FAQ)
- [ ] Marketing site reviewed: hero, features, how-it-works, pricing, FAQ, **comparison table**
- [ ] "A Halfstack product" footer + portfolio URL set (`site.halfstack`)
- [ ] Legal: Terms of Service + Privacy Policy live
- [ ] Comparison-page disclaimer present (CLAUDE.md §12)
- [ ] Responsive + empty/loading/error states + basic a11y pass
- [ ] Vercel Analytics + Speed Insights in root layout
- [ ] SEO basics: titles/descriptions, favicon (the app's **own** mark), OG image

### 5 · Launch — 🔒 HARD GATES (all must pass)
- [ ] 🔒 RLS on every table, policies tested
- [ ] 🔒 No secret in git; runtime secrets only in Vercel env
- [ ] 🔒 Service-role key not reachable from the client bundle
- [ ] 🔒 Stripe webhook signature verified; live keys in prod, test keys out of prod
- [ ] 🔒 Auth + protected routes verified
- [ ] 🔒 ToS + Privacy live on the domain
- [ ] 🔒 Comparison claims re-checked against current incumbent pricing
- [ ] Supabase upgraded to Pro if the app will have live users (no sleeping project)
- [ ] Stage set to `5 Launched ✅` in `/PROJECTS.md`

### Post-launch — growth (full runbook: `docs/GROWTH.md`)
- [ ] First real payment processed end-to-end
- [ ] Google Search Console verified + sitemap submitted + key pages indexed
- [ ] Bing Webmaster verified + sitemap submitted
- [ ] 3–5 cornerstone posts published (incl. the "<incumbent> alternative" post)
- [ ] `content-backlog.md` seeded + **scheduled content agent live (≤2–3 posts/day)**
- [ ] Listed on AlternativeTo + SaaSHub + 3–5 directories
- [ ] Product Hunt launch done
- [ ] Structured data (FAQ / Product) added
- [ ] Weekly GSC review scheduled
- [ ] Backlog of v1.1 improvements started

### Monthly upkeep
- [ ] Re-verify incumbent pricing in comparison (also §12 compliance)
- [ ] Add alternative pages for adjacent competitors
- [ ] Refresh/prune blog content based on GSC

---

## App notes
- **Part 5 (done):** real accounts — Supabase email+password **and** Google OAuth,
  a $10/mo **Pro** subscription (Stripe Checkout + verified webhook + portal,
  idempotent), a free-tier **3-active-QR quota** enforced atomically server-side
  (`try_activate_qr` + a publish-guard trigger), and **real scan analytics** —
  `/q/[slug]` records one hosted-page scan and `/r/[slug]` records + 302-redirects
  tracked URL codes, with bots / prefetches / the owner's own previews excluded and
  a one-way visitor hash (never a raw IP). SQL in
  `supabase/migrations/0002_auth_billing_analytics.sql`.
- **Account home & dashboard (done):** a proper signed-in product home at
  `/dashboard` — "Welcome back, {name}", real overview cards (Active QR Codes ·
  Total Scans · Unique Visitors · Last 30 Days), a range-toggled scan-activity
  chart (7/30/90/all), the most-scanned QR, and recent QR codes with per-row
  actions. **My QR Codes** (`/dashboard/qr-codes`) gained search + destination /
  unique / updated columns + mobile cards + tracking-honest scan labels ("No scans
  yet" / "Tracking disabled" / "Native QR — not trackable"). **Per-QR analytics**
  (`/dashboard/qr-codes/[id]/analytics`) added device / OS / browser / country /
  referrer breakdowns + a privacy-safe recent-activity feed (no IP, no identity).
  New **Settings** page (`/dashboard/settings`, edit display name), account menu +
  sidebar gained Settings + Create New QR, and normal sign-in lands on `/dashboard`
  (the in-flow QR-wizard redirect is still preserved). New analytics SQL:
  `supabase/migrations/0003_dashboard_analytics.sql`. Data layer is owner-scoped
  security-definer RPCs (no N+1); the app degrades gracefully if 0003 isn't applied.
- **Build runs in 4 parts** (see `CLAUDE.md`). Part 1 shipped the core engine:
  16-type registry + wizard shell, with Website / WhatsApp / WiFi / vCard fully
  working end-to-end (validated content → real scannable QR → 1024px PNG download),
  no Supabase required.
- **Part 2 (code complete):** all 16 content forms, direct QRs for Facebook /
  Instagram / URL-mode Video / MP3 / Menu (decode-verified), full Supabase
  publishing stack (`supabase/migrations/0001_qr_codes.sql`, storage buckets,
  upload + publish APIs, `/q/[slug]` public pages). ✅ **Live-verified 2026-07-17**
  against the real Supabase project (ref `kxlqvzhvpnuqrzwubycs`): 23/23 RLS/storage
  security checks, all 10 hosted types published E2E, QR/PNG/SVG decoded,
  republish-same-slug + archive-404 confirmed.
- **Part 3 (done):** full design editor (patterns, corners, colors/gradients, local
  logo w/ forced EC-H, margin), readability gating, single render pipeline shared by
  preview + export. Styled outputs independently decoded (jsQR + ZXing). Plus a
  **Step-1 hover sample preview**: hovering/focusing any of the 16 type cards previews
  a realistic sample of that type in an upgraded phone-frame mobile preview
  (`lib/qr/sample-previews.ts`; split value/setter hover contexts so the cards don't
  re-render on hover). Verified live across all 16 types; click still advances.
- **Part 4 (done, live-verified):** PNG 512/1024/2048 + real vector SVG export (all
  decode-verified), Step-4 experience, QR dashboard w/ archive/restore, secure
  edit-existing flow. Supabase schema applied via `SUPABASE_FULL_SETUP.sql`;
  `pnpm verify:supabase` 23/23; hosted E2E green for all 10 types.
- **Deployed:** live at **https://the-qr-gate.vercel.app** (Vercel, Seleem's
  project). Stripe is optional (lazy `getStripe()`, webhook 503 when unconfigured) so
  it deploys with no Stripe env. Code on `github.com/jovywahba/The-QR-Gate`
  (repo root = the app, flattened for Vercel default root detection).
- Accounts still to formalize: dedicated Gmail, own domain, Stripe (billing not wired
  yet). Supabase project `kxlqvzhvpnuqrzwubycs` is live (free tier — upgrade to Pro
  before real users rely on printed codes so it never sleeps).
- WiFi passwords are never persisted or logged (memory-only; drafts redact them).
