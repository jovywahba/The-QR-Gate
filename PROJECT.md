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
| Stage | `4 Polish` — see the **Production Truth Audit** below for the verified per-feature status |
| Live URL | https://www.theqrgate.com |

> 💳 **Stripe env var names the code REQUIRES** (set these exact names in Vercel):
> `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, **`STRIPE_PRICE_PRO_MONTHLY`** (the
> $10/mo Price id — this exact name, not `STRIPE_PRICE_ID`/`NEXT_PUBLIC_STRIPE_PRICE_ID`).
> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is **not** required (checkout is Stripe-hosted).
> Webhook endpoint: `https://www.theqrgate.com/api/stripe/webhook`. Verify readiness at
> `/api/health` → `payments` should read **operational** (it's `degraded` if the secret
> is set but the price env is missing/misnamed).

## Production Truth Audit — current state (2026-08-01)

> Authoritative current-state matrix, produced from a code+DB audit (not from
> older Markdown). Historical dated entries in `CHANGELOG.md` are kept as-is;
> **this section is the source of truth for "what is real right now."**
> Statuses: **LIVE** = implemented + live-verified · **IMPL** = implemented, not
> yet live-verified end-to-end · **CFG** = code complete, external configuration
> required · **PARTIAL** = some spec features present, others absent · **NONE** =
> not built · **STALE** = documentation was inaccurate (now corrected).

**Core QR product**

| Area | Status | Notes |
|------|--------|-------|
| 16 QR types · 4-step builder · registry SoT | LIVE | verified in browser + tests |
| Step-3 design preview (incl. hosted design-preview payload) | LIVE | decodes to `…/design-preview`; verified prod 2026-08-01 |
| Templates · frames · PNG/SVG export (one pipeline) | LIVE | independent decode QA |
| Public `/q/[slug]` (+ `PublicShell`) · tracked `/r/[slug]` · scan analytics | LIVE | DB operational; `/q`,`/r` record real scans |
| 3-free-active-QR quota (`try_activate_qr` + publish trigger) | LIVE | live-verified 2026-07-24 |
| Folders/tags UI · scheduling · version history + restore · pause · duplicate · Health Score · UTM | IMPL | present in code; not all re-verified this cycle |

**Auth / billing / infra**

| Area | Status | Notes |
|------|--------|-------|
| Supabase auth (email+password) + Google OAuth | LIVE | `/sign-in` 200; OAuth callback wired |
| Stripe Checkout · webhook (signature-verified, idempotent) · portal | CFG | config live (`/api/health` payments=operational); **full sandbox card→webhook→DB flow NOT live-verified** (card entry out of scope for the agent) |
| Live-mode vs test Stripe keys in prod | CFG | `payments=operational` proves keys are set; **owner must confirm they are LIVE-mode before charging real customers** |
| Migrations 0000–0005 applied to prod | LIVE | 0004/0005 live-verified 2026-07-24 (see CHANGELOG); DB currently operational |
| Custom domain `www.theqrgate.com` · `/api/health` · `/status` | LIVE | routes 200; storage health made honest 2026-08-01 (was hardcoded) |
| Legal `/privacy` · `/terms` | LIVE | 200; flagged for legal review before launch |

**Admin panel** (foundation is real; several spec sections are partial or absent)

| Section | Status | Notes |
|---------|--------|-------|
| Authz core — 4 roles (super_admin/admin/support/analyst), fail-closed guard, DB re-check | LIVE | permission matrix live-verified 2026-07-24; `roles.ts` unit-tested |
| `admin_memberships` + super_admin **bootstrap** | CFG | table is empty in prod — owner must run the 1-line bootstrap SQL below; until then `/admin` correctly 404s for all |
| Overview (`/admin`) | PARTIAL | every metric is a real query; **no charts, no revenue, no system-health card, no failed-payments, no archived count** |
| Users (`/admin/users`) | PARTIAL | list/detail/suspend/reactivate/reset/comp-Pro real + audited; **missing: revoke-sessions (standalone), export user data, admin notes** |
| QR Codes (`/admin/qr-codes`) | PARTIAL | pause/unpause/archive + status filters real, no WiFi/protected leak; **missing: search, version history, copy-URL, broken-asset check, Expired/Protected filters** |
| Subscriptions (`/admin/subscriptions`) | PARTIAL | real read-only Stripe mirror + separate comp entitlements; **missing: active-QR usage, explicit Free bucket, dedicated payment-failure state** |
| Audit Log (`/admin/audit`) | PARTIAL | append-only, DB-enforced, atomic writes; **missing: filters, pagination, metadata display** |
| Team (`/admin/team`) | PARTIAL | add/change-role/disable, super-admin-only; **missing: last-activity, and an explicit last-super-admin guard (governance risk — flagged)** |
| Analytics (system-wide) | NONE | no `/admin/analytics`; per-user analytics exist but no admin-gated system-wide RPCs |
| Reports / weekly email | NONE | no `/admin/reports`, no `scheduled_reports` table, no cron; health honestly says `not_configured` |
| Security Center | NONE | no route; failed-logins/webhook-failures/permission-denials are **not recorded** anywhere yet |
| Support Center | NONE | no dedicated route (support role reuses shared pages); no admin-notes feature |
| Global Search | NONE | no permission-aware global search box |
| System-Health admin page | NONE | only the public `/status` + `/api/health`; no admin page, no webhook-delivery/cron checks |

> **Phase 2 COMPLETE (2026-08-01) — admin panel finished + live-verified:** the
> pre-Phase-2 matrix above is superseded. All gaps built: 5 new pages
> (Analytics/Reports/System-Health/Security/Support), permission-aware global
> search, Overview charts + metrics, the last-super-admin guard (DB + app +
> tests), user revoke-sessions/export/notes, the security recorder, AND the three
> remaining pages **wired to their 0006 RPCs** (QR Codes → `admin_qr_list`/
> `admin_qr_detail` w/ search+filters+copy-URL; Subscriptions → `admin_subscriptions_list`
> w/ active-QR usage; Audit → `admin_audit_query` w/ filters+pagination+metadata).
> **Live-verified:** migration 0006 applied (anon RPC/table probe → gated/protected),
> and Playwright `admin-gate.spec.ts` **passed 22/22 against production** (anon
> `/admin/*`→404, `/dashboard/*`→sign-in, public→200, unsigned webhook→400).
> **Still needs the owner:** authenticated role-matrix E2E (seeded per-role
> sessions on an isolated test project — I can't sign in). Revoke-sessions is
> Implemented but not exercised without a live session.

**Audit-surfaced defects (fixed / to fix)**

- ✅ **Fixed 2026-08-01 (Phase 1):** `/api/health` storage was hardcoded `operational` — now derives from DB reachability (honest).
- ✅ **Fixed 2026-08-01 (Phase 2):** explicit **last-super-admin guard** — enforced in the DB (`admin_grant_role`, advisory-locked), an app pre-check, and unit tests.
- ✅ **Fixed 2026-08-01 (Phase 2):** `revoke_sessions` (revoke-sessions action) and user-data **export** (`export_user_data`) are now implemented + audited (previously declared-but-unbacked).
- ⚠️ **Still open:** `admin_log()` DB grant is gated by *any* active admin, not a specific permission (coarse); the DB role re-check is role-set coarse vs the app's fine matrix. (Low risk — non-admins still can't write; a follow-up can tighten.)

**Enterprise expansion (spec Phases 5–16) — not built (roadmap):** password-protected QR pages, custom slugs + aliases, bulk CSV import, team workspaces, branded tracking domains, public API (v1 + keys/scopes), campaigns, conversion tracking, live scan globe, deep per-type public redesign, editor↔public component unification, 6 new QR types (Email/SMS/Event/Review/Text/Location).

### Migration status (0004+0005 live-verified 2026-07-24; see CHANGELOG for the dated run)

| Migration | What | Applied to prod? |
|-----------|------|------------------|
| `0000`–`0002` | Core schema, auth, billing, analytics, RLS | ✅ applied |
| `0003_dashboard_analytics.sql` | unique visitors, daily activity, OS breakdown, recent feed | ✅ applied (confirmed live — dashboard shows real numbers, not the fallback) |
| `0004_admin_expansion.sql` | admin platform, presence, pause, suspension, entitlements | ✅ **applied** (live-verified 2026-07-24: 48/49 checks; full permission matrix enforced) |
| `0005_product_features.sql` | scheduling, folders, tags, version history, notifications | ✅ **applied** (live-verified 2026-07-24) |
| `0006_admin_completion.sql` | admin notes, export jobs, security events, last-super-admin guard, admin analytics/QR/subscriptions/audit/search RPCs | ✅ **applied** (2026-08-01) — **live-verified**: all 11 new RPCs exist + anon-gated (anon → forbidden), all 3 new tables RLS-protected (anon probe with the prod key). |

> ✅ **Migrations 0004 + 0005 are applied and live-verified** (48/49 checks on
> 2026-07-24). The admin authorization matrix — the four admin roles
> **super_admin / admin / support / analyst** (a user with no `admin_memberships`
> row is a normal, non-admin user) — is enforced by the database.
>
> ⏳ **One step left for `/admin`:** the owner's account must be bootstrapped as
> super_admin (currently `admin_memberships` is empty). Run this ONE statement in
> the SQL Editor (resolves the UUID from the email, idempotent):
>
> ```sql
> insert into public.admin_memberships (user_id, role, is_active)
> select id, 'super_admin', true from auth.users where email = 'jovywahba@gmail.com'
> on conflict (user_id) do update set role = 'super_admin', is_active = true;
> ```
>
> Until then `/admin` correctly 404s for everyone (guard fails closed).

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
- **Step-3 hosted-QR preview + public scan shell (2026-08-01):** the design editor
  always shows a real, scannable QR — hosted/tracked types render a safe owned
  **design-preview payload** (`…/design-preview`, never localhost/fake slug) via
  `lib/qr/preview-payload.ts`; hosted Download stays blocked until publish, then the
  code swaps to the live `/q/[slug]`. New `/design-preview` page + shared `PublicShell`
  (premium mobile-first frame) now wrap `/q/[slug]` + notices. Browser-verified (real
  QR renders + updates + decodes to `…/design-preview`; no 320/768 overflow). +13
  tests. **Still deferred:** editor↔public component unification (two trees), per-type
  public page redesigns, password-protected pages (unbuilt — no schema).
- **Product features (Part 9, needs `0005` applied):** **Analytics CSV export**
  (owner-scoped, formula-injection-safe, no IP/identity — no migration needed);
  **UTM builder** on URL types (merges into the encoded URL; tested); **QR Health
  Score** 0–100 over the readability engine (Excellent/Good/Needs Attention/Unsafe;
  Unsafe still blocks download; shown in Step 3; no migration); real **legal pages**
  (`/privacy`, `/terms`) reflecting actual behavior, flagged for legal review;
  **scheduling** (start/end/timezone/fallback columns + server-time enforcement on
  `/q`+`/r` with "not available yet"/"ended" notices + a Schedule dialog + tested
  util); **version history** snapshots on publish (`snapshot_qr_version`); **first-scan
  celebration** (owner notification on the first human scan + a subtle dashboard
  toast, reduced-motion aware); and the **folders/tags** schema. New SQL:
  `0005_product_features.sql` + `SUPABASE_PRODUCT_FEATURES.sql`. All degrade
  gracefully until applied. **Deferred (schema/roadmap):** folders/tags UI, version
  restore UI, password-protected pages, custom slugs + aliases, bulk CSV import,
  weekly email reports, AI Design Assistant, SEO cornerstone articles, verified
  competitor comparison pages, status-monitoring health endpoint.
- **Admin platform (`0004`/`0005` applied; see the Production Truth Audit above for which sections are PARTIAL vs NOT built):** a secure `/admin` surface
  distinct from the user dashboard. DB-enforced roles (`super_admin`/`admin`/
  `support`/`analyst`) via `admin_memberships` + a centralized server guard
  (`lib/admin/guard.ts`) that 404s non-admins; **every privileged DB function
  re-checks the role** so the guard isn't the only gate. Pages: Overview (real
  metrics + live "online now" presence), Users (search/filter) + user detail with
  audited actions (suspend/reactivate via a real auth ban, password reset,
  grant/remove complimentary Pro), QR moderation (pause/unpause/archive), Audit
  Log (append-only), Subscriptions (read-only; Stripe stays source of truth),
  Admin Team (super-admin only). Privacy-conscious presence heartbeat
  (`/api/presence`, opaque per-tab id, no IP/token). New: `0004_admin_expansion.sql`
  + `SUPABASE_PRODUCT_ADMIN_EXPANSION.sql`.
- **Pause + Duplicate (done):** users can Pause a published QR (public page shows a
  polished paused notice; slug + analytics preserved; frees a free-plan slot) and
  Duplicate any QR into a new draft (`— Copy`; never copies slug/analytics/publish
  state; no slot consumed until published). Suspended accounts are blocked in the
  app shell + at publish time (defense in depth over the auth ban).
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
