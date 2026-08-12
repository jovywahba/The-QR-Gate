# Template Changelog

Every change to `_template/` (code, tokens, billing, auth) gets a dated line here so we can reason about drift across already-built apps. See `CLAUDE.md` §7.

Format: `YYYY-MM-DD · [design vX.Y | template] what changed · backport? (which live apps need it)`

## Unreleased
- 2026-06-19 · [design v2.0 | template] Rebrand **Tenth → Halfstack** ("Full Stack, Half Price"). Logo: X monogram → four-bar **stack mark** (`HalfstackMark`/`HalfstackEndorser`, `app/icon.svg`, `brand-assets/`). Positioning: one-tenth → half (`site.ts` defaults $12→$60, comparison tables, marketing copy, root §11 rule). Tokens/type/spacing/color **unchanged**. Full spec consolidated in `Halfstack Design System/` (v2.0). Backport? n/a — no live apps yet.
- 2026-06-18 · [design v1.1 | template] v1.1 component essentials added to `components/ui/` (shadcn new-york, customized to Halfstack): alert, alert-dialog, avatar, checkbox, dialog, dropdown-menu, radio-group, select, separator, sheet, skeleton, sonner (toast), switch, table, tabs, textarea, tooltip. New deps `radix-ui` + `sonner`. Halfstack tweaks: checkbox/switch/radio selected = rationed accent; sonner themed to `--popover`, decoupled from next-themes. New app-shell: `user-menu` (avatar + dropdown with **sign-out**), `app-nav` (shared nav), `app-mobile-topbar` (Sheet mobile nav), `stat-card` (signature metric card). Root layout mounts `TooltipProvider` + `Toaster`; app layout adds mobile nav; dashboard uses `StatCard`. Shared Halfstack marks added at `brand-assets/`. v1.1 files use unified `radix-ui` + `data-slot` (original five unchanged, keep `// Halfstack:` markers). Backport? optional/additive — no live apps yet.
- 2026-06-17 · [template] Modular landing page added: hero (with product-preview frame), social-proof, comparison, feature grid, how-it-works, pricing card, FAQ (native `<details>`), CTA band — all driven by `lib/landing.ts`. Shared `PricingCard` used by landing + `/pricing`. Halfstack endorser touchpoints formalized (hero eyebrow, footer, auth, about, metadata `creator`/`publisher`). PROJECT.md gained the post-launch growth checklist (see `docs/GROWTH.md`).
- 2026-06-17 · [template] Initial scaffold built & type-checked (tsc clean): Next 15 + React 19 + Tailwind v4 + shadcn (new-york/stone/0.5rem) wired to Design System v1.0 tokens; Supabase auth (email+password) + RLS migration; Stripe trial Checkout + verified webhook + portal; Resend; marketing site (landing, pricing, alternatives/[slug], about, blog, docs, status, legal) + product shell; Vercel Analytics. `lib/site.ts` is the per-app config seam.

## App history (The QR Gate — beyond the template)
- 2026-08-12 · **Close remaining bugs + verification gaps.** (1) **QR-type deep
  linking fixed** — `/create?type=<id>` now selects the type and opens Step 2 for
  every registered type (invalid `?type=` falls back to Step 1); root cause was a
  step-default of 1 in both the server route and the client Back/Forward handler,
  unified behind a tested `resolveWizardStep()` helper. Live-verified on prod
  (wifi → Add Content + SSID form; bogus → the 16-type picker). (2) **Download gate
  is no longer a surprise** — signed-out users see "Sign in to download" + a
  "your design is saved, you'll come right back" note on Step 3 (the account gate
  itself is a deliberate, unchanged product choice). (3) **Privacy authoring note
  removed** — the visible "Review note" ("legal entity … should be confirmed …
  reviewed by counsel") is gone; Terms keeps honest generic governing-law/refund
  clauses. (4) **Auth-email audit:** app transactional email (Resend) is **not
  configured** in prod (`RESEND_API_KEY` absent; `EMAIL_FROM` present) and the code
  degrades to a **silent no-op** — the UI never claims an email was sent for these;
  Supabase auth emails are wired (signup `emailRedirectTo`, reset `redirectTo` →
  `/auth/confirm`) but delivery config lives in the Supabase dashboard (owner check).
  (5) **Playwright expanded to 50 passing** (deep links ×6 + invalid, Step-1 empty
  state, public auth pages, protected-route redirect restoration) **+ 4 auth-gated
  tests scaffolded** behind `AUTH_STATE` (skip without a seeded session). 373 unit
  tests, tsc/lint/security/build green. **Still blocked (no auth):** signed-in
  dashboard/admin QA, real checkout→webhook→Pro entitlement, auth-email delivery.
- 2026-08-12 · **Live production browser QA (post-fix verification).** Tested the
  deployed site as a real user (in-page DOM measurement — the pane can't screenshot
  here — which is more precise than eyeballing for these bugs). Confirmed working
  live: type-select → Step 2 → Step 3, the QR renders (640² canvas, correct 38-char
  payload), Enlarge preview (960², not blank), and **Stripe Live health is fully OK**
  (`/api/health/stripe`: live keys, $10/mo USD monthly, product-name match, all true).
  **Fixed three real bugs found live:** (1) the Step-1 mobile sample previews were
  cropped for **all 16 types** (not just the 3 the earlier audit named) — the sample
  phone shell was a fixed 9:19.5 while every supplied image is 941×1672 (9:16), so
  `object-cover` shaved ~20% off the sides; now the shell's aspect is driven from the
  artwork dimensions (crop delta 0.12 → 0.013, verified live). (2) The homepage (which
  *is* the generator) had **no footer and a tool-only header** — added a `(generator)`
  layout with the shared `SiteFooter` + a Pricing link in the wizard header, so it
  reads as one product. (3) The header **overflowed 8px at 320px** — the CTA now uses
  a short "Create" label under ~400px. New `e2e/generator.spec.ts` guards all three.
  **35 Playwright tests pass against production**; tsc/lint clean, 368 unit tests,
  build green, verify:security PASS. **Blocked (unchanged):** sign-in-gated
  dashboard/admin/checkout-completion and auth-email delivery — the agent can't
  authenticate or create accounts.
- 2026-08-12 · **Production QA pass — public-facing repair (P0/P1/P2).** Acting on a
  real production audit. **Killed every public template-residue leak** (the biggest
  trust problem): removed the "$120→$60 half-the-price" comparison story, the fake
  seat pricing ($120/$60/$18,000), the `TODO` price label, the "Incumbent"
  placeholder + empty comparison date, and the "Template document / to be confirmed"
  legal placeholders — all traced to `lib/site.ts` template residue. Rewrote
  `lib/site.ts` + `lib/landing.ts` to the real positioning (a $10/mo QR generator,
  no competitor framing); deleted the `/alternatives` route + `ComparisonTable`;
  fixed the legal shell (removed the public "template document" notice) and the
  Terms placeholders (entity / governing-law / refund) into honest, product-accurate
  copy; rewrote About + Pricing (real single-plan page with a Free + Pro card);
  enriched the thin Help Center (`content.ts`) into 5 accurate docs and fixed the
  wrong "free trial" billing copy. **Fixed nav/footer:** header + footer no longer
  point at dead `/#features`/`/#pricing`/`/#faq` anchors — they link to real pages
  (`/`, `/pricing`, `/docs`, `/blog`, `/dashboard`, `/status`, support mailto).
  **Wizard bugs:** grammar "Encodes a your URL" → fixed; the UTM "Final URL" preview
  now shows the normalized `https://…` it actually encodes; QR Health no longer
  labels a design "Excellent" while a warning is active (caps at "Good") — with a
  regression test. Verified the "Enlarge preview" QR renders (960×960, not blank —
  the audit's blank was the earlier render delay). New Playwright `marketing.spec.ts`
  guards against the leaks + the retired comparison page. tsc/lint clean, 368 Vitest
  tests, build green, verify:security PASS. **Honestly NOT done this pass** (blocked
  or larger): sign-in-gated dashboard/admin/payment testing (can't authenticate),
  transactional email config, the Step-1 static-sample mobile-preview cropping, and
  a unified homepage nav/footer shell on the generator — all itemized in PROJECT.md.
- 2026-08-01 · **Admin Promo Codes.** New `/admin/promo-codes` — an admin can
  create discount codes for The QR Gate Pro (percent or fixed USD; first-payment /
  N-months / forever; optional max-uses + expiry). They're **real Stripe Coupons +
  Promotion Codes** (Stripe is the source of truth; checkout already allows
  promotion codes, so they work at the Stripe checkout page immediately). New
  permission `manage_promotions` (super_admin + admin only; unit-tested in the
  role matrix) + a nav entry. Pure, tested `lib/stripe/promos.ts` (validate +
  normalize + format), server list in `promos-server.ts`, audited create/deactivate
  actions (`admin_log`). No local promo table — nothing to migrate. Degrades
  honestly when Stripe isn't configured. +13 tests (367 total); tsc/lint clean,
  build green, verify:security PASS.
- 2026-08-01 · **Production Stripe hardening (Live mode).** Owner switched Stripe
  to Live in Vercel Production. Hardened + made it self-verifying without ever
  exposing a key/id: `lib/stripe/config.ts` now enforces **Vercel PRODUCTION ⇒
  LIVE secret key** (`secretKeyMode`/`requiresLiveKey`/`liveKeySatisfied`;
  `isBillingConfigured` returns false for a test key in prod so checkout can't
  charge through Sandbox), keeps Preview/Dev on Sandbox, and adds
  `eventMatchesKeyMode` so **Live and Sandbox webhook events can't be mixed**
  (the webhook now acknowledges-but-ignores an event whose `livemode` disagrees
  with the key — on top of the existing raw-body + signature verification). New
  pure `lib/stripe/price-check.ts` (`evaluatePrice`) validates the configured
  price: active · USD · unit_amount 1000 · monthly · product name "The QR Gate
  Pro". New `lib/stripe/verify.ts` + **`GET /api/health/stripe`** run that check
  live on the server (Live key only exists in prod) and return **safe booleans
  only — never a key, price/product/customer id, or payload** (cached 60s).
  `verify:security` now also asserts no client component references a Stripe
  secret. Checkout still uses ONLY `STRIPE_PRICE_PRO_MONTHLY` (browser can't
  pass a price); portal uses the stored customer server-side; all URLs use
  `https://www.theqrgate.com`. +15 tests (354 total: production-rejects-test-key,
  dev-permits, wrong amount/currency/interval, inactive, name-mismatch, key-mode,
  event-mode). tsc/lint clean, build green, verify:security PASS. **A real card
  payment is NOT claimed as verified — that's the owner's manual step.**
- 2026-08-01 · **Admin completion — page wiring + live verification (Phase 2 finish).**
  Migration 0006 applied to prod + super_admin bootstrapped by the owner.
  **Live-verified against the production DB (anon probe):** all 11 new 0006 RPCs
  exist and are correctly gated (anon → forbidden, not missing) and all 3 new
  tables are RLS-protected. Wired the three remaining existing pages to their
  0006 RPCs: **Admin QR Codes** (`admin_qr_list`/`admin_qr_detail` — search by
  owner/name/id/slug, all status + scheduled/expired filters, scans/unique/
  last-scan/version/schedule columns, copy public URL, moderation-locked badge;
  password/health/broken-asset honestly deferred to their features);
  **Subscriptions** (`admin_subscriptions_list` — status buckets, active-QR
  usage vs quota, cancel-at-period-end, complimentary shown separately);
  **Audit** (`admin_audit_query` — action/target/date filters + pagination +
  safe metadata viewer). **Playwright genuinely installed + run** (chromium via
  npx; project lockfile untouched since pnpm is broken here): the deterministic
  `admin-gate.spec.ts` **passed 22/22 against production** (every `/admin/*`→404
  anon, `/dashboard/*`→sign-in, public→200, unsigned webhook→400). Authenticated
  role-matrix E2E still needs seeded per-role sessions (documented). tsc/lint
  clean, 333 tests, verify:security PASS, build green.
- 2026-08-01 · **Admin panel completion (enterprise Phase 2).** Completed the
  existing admin platform (no second system). New migration
  `0006_admin_completion.sql` (+ consolidated `SUPABASE_ADMIN_COMPLETION.sql`,
  identical body): `admin_notes`, `admin_export_jobs`, `security_events` (all
  RLS select-only, service-role/definer writes); a hardened `admin_grant_role`
  with an explicit, advisory-locked **last-super-admin guard** (can't demote/
  remove/disable the final super admin); extended `get_admin_overview`
  (archived/trialing/past-due/comp/unique-visitors); and new admin-gated RPCs
  `admin_analytics`, `admin_qr_list`/`admin_qr_detail`, `admin_subscriptions_list`,
  `admin_audit_query`, `admin_global_search`, `admin_add_note`/`admin_list_notes`,
  `admin_record_export`, `admin_security_events`. New pages **/admin/analytics,
  /admin/reports, /admin/system-health, /admin/security, /admin/support** +
  permission-aware **global search** in the shell + nav entries (each gated by
  permission). Overview gained real metric cards + 30-day scan/registration
  charts; revenue shown honestly as "Not configured". New user privileged
  actions: **revoke sessions**, **export user data** (safe JSON, no secrets/
  content), **internal notes** — all audited, reason+permission gated. New
  permissions in `roles.ts` (view_reports/security/system_health/support,
  global_search, manage_notes, revoke_sessions, export_user_data) with the
  role matrix extended + unit-tested; pure last-super-admin helper +
  `security.ts` recorder wired into `assertAdmin` denials. `/api/health` storage
  fix from Phase 1 retained. **DB-dependent pages degrade honestly to "Code
  complete — migration required" until 0006 is applied** (never fake data).
  tsc/lint clean, **333 tests** (+38), build green. **Not live-verified** (needs
  0006 applied + the super_admin bootstrap). Deferred to the next increment:
  Playwright admin E2E (not installed; needs a live super_admin session) and the
  executable launch-security script (needs the service-role key + applied 0006).
- 2026-08-01 · **Production truth audit + doc reconciliation (enterprise Phase 1).**
  Ran a 9-agent code+DB audit of the whole admin panel vs the target 12-section
  spec. Result recorded as the authoritative **Production Truth Audit** matrix in
  `PROJECT.md` (statuses: LIVE / IMPL / CFG / PARTIAL / NONE / STALE). Key truths:
  the 4-role authz core, `admin_memberships`, `get_admin_overview`, `admin_list_users`,
  the append-only audit ledger, QR moderation, suspension, entitlements, presence, and
  the Stripe-mirror subscriptions view are **real and DB-backed**; Overview/Users/QR/
  Subscriptions/Audit/Team pages are **PARTIAL** (missing charts, revenue, revoke-sessions,
  export, admin notes, QR search, version history, audit filters/pagination, and a
  last-super-admin guard); Analytics/Reports/Security/Support/Global-Search/System-Health-
  admin-page are **NOT built**. Fixed two audit-caught defects: (1) `/api/health` File
  storage was **hardcoded `operational`** → now derives from real DB reachability;
  (2) reconciled the contradictory verification counts and mislabeled role in the docs
  (kept dated history, added the current-state matrix). `CLAUDE.md` now documents the
  admin panel (previously omitted). No feature code changed beyond the health fix.
- 2026-08-01 · **Step-3 hosted-QR preview fix + public scan shell.** Fixed the
  reported bug where hosted QR types (PDF, links, business, images, social, apps,
  coupon, upload Video/MP3, PDF/rich Menu — and any direct type with tracking on)
  showed an EMPTY QR during Step-3 design ("This QR type lives on a hosted page…")
  because their real `/q|/r/[slug]` doesn't exist until publish. Root cause:
  `derivePayload` returns "" for `encodesServerUrl` modes pre-publish and the
  preview rendered that empty payload. Fix: new `lib/qr/preview-payload.ts` — a
  safe, decodable, **owned** design-preview payload (`…/design-preview`, never
  localhost, never a guessed slug), resolved by the pure `resolvePreviewPayload()`.
  The wizard now exposes `previewPayload`/`previewMode`; Step-3 preview, enlarge
  dialog, mobile sheet, Step-4 preview, and the health score all render it through
  the ONE composition pipeline. **Download stays blocked** for hosted types until
  publish (it still uses the real committed payload); after publish the preview
  swaps to the live `/q/[slug]` ("Live QR" badge) with the design unchanged. New
  honest `/design-preview` landing page is the payload's target. Public scan pages:
  new shared `PublicShell` (premium mobile-first frame — brand header, rounded card
  + soft shadow, safe-area, endorser) now wraps `/q/[slug]` and the paused/scheduled
  notices, unifying 3 duplicated scaffolds. Browser-verified live: real QR renders
  in Step-3 for PDF, updates on design change, **independently decodes to
  `https://www.theqrgate.com/design-preview`**; no 320/768 overflow. +13 tests
  (295 total). tsc/lint clean; build green. Deferred (honest): full editor↔public
  component unification (still two trees), per-type public redesigns, and
  password-protected pages (unbuilt — no schema).
- 2026-07-24 · **Stripe billing hardening + domain audit.** Custom domain
  `www.theqrgate.com`: `site.ts` normalizes `NEXT_PUBLIC_SITE_URL` (strips trailing
  slash, guards malformed `//host`, real-domain fallback); stale demo URL fixed.
  Checkout: blocks a duplicate active/trialing sub (→ Manage Billing), stamps
  `user_id` on the subscription metadata (race-proof webhook linking), server-only
  price (`STRIPE_PRICE_PRO_MONTHLY`). Webhook: `current_period_*` read from the sub
  OR its item (API-version robust) + metadata-based user resolution that links the
  customer. Billing UI: past_due → "Update payment method", complimentary Pro shown
  separately (no Manage-billing dead-end), `already` banner. Health `/api/health`
  payments = operational only when checkout is truly ready (secret + price),
  "degraded" if the price env is missing/misnamed. Pure config + webhook helpers
  extracted and unit-tested. No new migration (billing schema already applied);
  reference `SUPABASE_STRIPE_BILLING.sql` added. 282 tests pass.
- 2026-07-24 · **Product features (part 10) + live verification.** Migrations 0004+0005
  applied to prod and **live-verified (48/49 checks)** — full admin permission matrix
  enforced by the DB. Built: **Folders/Tags** (owner-scoped CRUD actions + Organize
  dialog + folder/tag filter chips on My QR Codes; cross-user RLS verified live);
  **Version history** UI (`/dashboard/qr-codes/[id]/versions`) with Restore-as-unpublished
  (loads a snapshot into the editor; live page untouched until republish); **public
  status + `/api/health`** machine-readable endpoint (real probes: app/DB/public-QR/
  storage/auth/email/stripe, safe states, 503 when unavailable). Only remaining admin
  step: the owner's super_admin bootstrap row (one SQL statement). tsc/lint clean;
  269 tests pass; build green.
- 2026-07-24 · **Product features (part 9).** Analytics **CSV export** (owner-scoped,
  formula-injection-safe, no IP/identity); **UTM builder** on URL types; **QR Health
  Score** 0–100 over the readability engine (Unsafe still blocks download); real
  **legal pages** (`/privacy`, `/terms`) flagged for legal review; **scheduling**
  (start/end/timezone/fallback + server-time enforcement on `/q`+`/r` + Schedule
  dialog); **version-history** snapshots on publish; **first-scan celebration**
  (owner notification + subtle dashboard toast); **folders/tags** schema. New SQL
  `0005_product_features.sql` (+ consolidated) — degrades gracefully until applied.
  Pure utils unit-tested. tsc/lint clean; 269 tests pass; build green. Deferred:
  folders/tags UI, version restore UI, password pages, custom slugs, bulk CSV,
  weekly reports, AI assistant, SEO articles, comparison pages, status health endpoint.
- 2026-07-24 · **Admin platform + moderation primitives.** Secure `/admin` (DB-enforced
  roles super_admin/admin/support/analyst via `admin_memberships`; centralized guard that
  404s non-admins; every privileged RPC re-checks the role). Real Overview (metrics +
  "online now" presence), Users + user detail with audited actions (suspend via auth ban,
  reset password, grant/remove comp Pro), QR moderation (pause/unpause/archive), append-only
  Audit Log, Subscriptions (read-only), Admin Team (super-admin only). Privacy-safe presence
  heartbeat (`/api/presence`, opaque per-tab id, no IP/token). User **Pause** (paused public
  notice, preserves slug/analytics, frees a slot) + **Duplicate** (new draft, no slot until
  published). Suspended accounts blocked in the shell + at publish. New SQL
  `0004_admin_expansion.sql` + `SUPABASE_PRODUCT_ADMIN_EXPANSION.sql` (idempotent; app
  degrades gracefully until applied). Live security re-verified 35/35. Admin permission
  matrix unit-tested. tsc/lint clean, 238 tests pass, build green.
- 2026-07-24 · Professional **authenticated home & dashboard**. Redesigned `/dashboard`
  (welcome header, real overview cards incl. Unique Visitors, range-toggled scan-activity
  chart, most-scanned QR, recent QR list). **My QR Codes** got search + destination/unique/
  updated columns + mobile cards + tracking-honest scan labels. **Per-QR analytics** added
  OS breakdown + privacy-safe recent activity. New **Settings** page; account menu + sidebar
  gained Settings + Create New QR; `/create?new=1` starts a clean draft with a resume banner.
  New analytics SQL `0003_dashboard_analytics.sql` (unique visitors, daily activity, OS,
  recent) — additive/idempotent; app degrades gracefully until applied. Pure display/parse
  helpers unit-tested. tsc/lint clean, 194 tests pass.

## Design System
- v1.0 — initial token set (see `Halfstack Design System/`).
- v1.1 — additive: components, page patterns, system-level rules (tokens/type/spacing/color unchanged from v1.0). Essentials built into `_template`; full spec in `Halfstack Design System/` (`*v1.1*`). Deferred to per-product: charts, calendar/date-picker, command palette, popover, accordion, breadcrumb, pagination, combobox, slider, input-OTP, file upload.
- v2.0 — Halfstack rebrand (name + logo + half-price positioning); tokens/type/spacing/color unchanged from v1.1. Single consolidated spec file `Halfstack Design System.dc.html`.
