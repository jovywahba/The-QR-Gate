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
| Stage | `3 Building` (Part 1 of 4 — core engine) |
| Live URL | — |

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
- **Build runs in 4 parts** (see `CLAUDE.md`). Part 1 shipped the core engine:
  16-type registry + wizard shell, with Website / WhatsApp / WiFi / vCard fully
  working end-to-end (validated content → real scannable QR → 1024px PNG download),
  no Supabase required.
- **Part 2 (code complete):** all 16 content forms, direct QRs for Facebook /
  Instagram / URL-mode Video / MP3 / Menu (decode-verified), full Supabase
  publishing stack (`supabase/migrations/0001_qr_codes.sql`, storage buckets,
  upload + publish APIs, `/q/[slug]` public pages). ⚠️ **Blocked on provisioning:**
  hosted publishing is NOT verified — needs a real Supabase project (creds in
  `.env.local`, `pnpm db:push`) before it can be called working.
- **Part 3 (done):** full design editor (patterns, corners, colors/gradients, local
  logo w/ forced EC-H, margin), readability gating, single render pipeline shared by
  preview + export. Styled outputs independently decoded (jsQR + ZXing).
- **Part 4 (code complete):** PNG 512/1024/2048 + real vector SVG export (all
  decode-verified), Step-4 experience, QR dashboard w/ archive/restore, secure
  edit-existing flow. ⚠️ Live Supabase verification still blocked on real creds —
  runbook: fill `.env.local` → `pnpm db:push` → `pnpm verify:supabase` → hosted E2E.
- Accounts (Gmail/Supabase/domain/Stripe/Vercel) **not provisioned yet** — Part 1
  works entirely client-side by design.
- WiFi passwords are never persisted or logged (memory-only; drafts redact them).
- Remaining: Parts 2–4 (all 16 content forms; design editor + mobile page preview;
  publishing/hosted pages, database, billing, full QA).
