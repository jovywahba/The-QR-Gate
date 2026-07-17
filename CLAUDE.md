# online-qr-generator — App Context & Build Playbook

> Per-app guide for Claude + the partners. The root `/CLAUDE.md` is the LAW
> (stack, design system, security gates, conventions); the `/docs/` guides are
> the detail. This file = (1) what THIS product is, and (2) the exact, ordered
> flow to build it. Track status + gate checkboxes in `PROJECT.md`.

## 30-second orientation
- **Halfstack** rebuilds the core 80% of an established B2B SaaS at ~1/2 the price.
  Goal: 100 live products. This folder is ONE product — a fully isolated,
  independently sellable app (its own Supabase, Stripe, domain, Vercel).
- It's an **original, Halfstack-owned brand** that competes with **<Incumbent>** via
  truthful comparison. It wears the shared **Halfstack design system** and shows
  **"A Halfstack product"** in the footer (endorser). Support → **info@tryhalfstack.com**.
- Editing `lib/site.ts` + `lib/landing.ts` reskins ~everything — always start there.

---

## ⛔ SCOPE LOCK — THIS FOLDER ONLY (hard rule, zero exceptions)

**While working on this project, Claude touches ONLY this project's folder
(`<codename>/`). Nothing outside it. Ever.**

Do **not** create, edit, move, rename, or delete anything outside `<codename>/` —
and do not even copy code *out of* another location into here. Off-limits:

- **Every other project.** Each sibling app folder in `/halfstack` is forbidden
  (`../<other-app>/`). Don't edit them, and don't lift their code into this one.
- **Every global / shared file in `/halfstack`:**
  - root `CLAUDE.md`, `PROJECTS.md`, `README.md`
  - `docs/` (ENGINEERING · BRAND · MARKETING · GROWTH)
  - `Halfstack Design System/` (the spec + brand assets)
  - `_template/` itself
  - repo-level config (`.gitignore`, `.github/`, CI, root configs)

**These shared/global files belong to Seleem.** Only **Seleem** changes the design
system, the template, the docs, the root trackers, or any other app. Not Claude —
not while building a product.

**If this project needs something shared** (a new/updated component, a token tweak,
a doc fix, a template improvement, or a fix that really lives in another app):
Claude does **NOT** make it here, and does **NOT** drop in a local one-off. Claude
**STOPS and asks Seleem** to make the change upstream so every app inherits it
(see *No one-off components* below and root §16).

No exceptions — not "it's a one-line fix," not "it's clearly a bug," not "it'd be
faster," not "the task seems to need it." **Outside this folder = not yours to touch.
When in doubt, stop and ask Seleem.**

---

## What this product is
- **Incumbent:** QR Code Generator PRO (Bitly, qr-code-generator.com)
- **Public brand:** The QR Gate   ·   **Domain:** TBD
- **Core 80%:** a 4-step QR builder — Select QR Type → Add Content → Design QR Code
  → Download QR Code — covering 16 QR types (direct types encode the payload in the
  QR itself; hosted types get a mobile landing page). Real, scannable output only —
  no fake previews, no placeholder QRs.
- **Pricing:** TBD vs incumbent (≈1/2; verify source + date in PROJECT.md before any claim)

### Build plan (4 parts)
1. **Part 1 (done):** project setup + core QR engine. Registry of all 16 types; wizard
   shell (stepper, type grid, sticky preview, mobile preview sheet); 4 fully working
   direct types (Website, WhatsApp, WiFi, vCard) with Zod validation, live rendering
   via `qr-code-styling`, safe sessionStorage drafts (WiFi password memory-only),
   1024×1024 PNG download.
2. **Part 2 (done, live-verified):** all 16 content forms + live previews; Supabase
   publishing system (migrations `0001_qr_codes.sql`: qr_codes / qr_link_items /
   qr_social_items / qr_assets, RLS owner-only, `get_public_qr()` public read path,
   `qr-private`/`qr-public` storage buckets); signed-URL uploads with server-side
   magic-byte verification; `/api/qr/upload[,/confirm]` + `/api/qr/publish` (server
   revalidation, ownership checks, crypto slugs); published pages at `/q/[slug]`.
   Verified 2026-07-17 against the live Supabase project: `pnpm verify:supabase`
   23/23 RLS/storage/RPC checks, all 10 hosted types published E2E.
3. **Part 3 (done):** real Step-3 design editor — presets (real mini-QR tiles),
   6 dot patterns, corner square/dot styles, solid + linear/radial gradient colors
   with rotation, local logo (validated data URL, auto-EC H, 10–25% cap), error
   correction, proportional quiet-zone margin. One pipeline
   (`lib/qr/styling.ts#buildQRStylingOptions`) feeds preview, thumbnails, Step 4,
   and PNG export. `lib/qr/readability.ts` heuristics (contrast/margin/logo) —
   errors block Continue + download. Styled QRs verified by independent decode
   (jsQR + ZXing); note: jsQR alone is too strict for the "dots" pattern — ZXing
   (real-scanner engine) decodes it fine.
   - **Step-1 hover preview:** hovering/focusing any of the 16 type cards previews a
     realistic sample of that type in the mobile preview (`lib/qr/sample-previews.ts`
     — one `QRContent` sample per type with inline-SVG images; rendered through the
     same destination components). Split value/setter contexts in
     `hover-preview.tsx` keep the 16 cards from re-rendering on hover. Preview
     priority: hovered sample → live form content → welcome. Click still advances.
4. **Part 4 (done, live-verified + deployed):** Step-4 export panel (PNG 512/1024/2048
   at true resolution + real vector SVG, one pipeline, exact blocking reasons),
   `/dashboard/qr-codes` (RLS-scoped list, filters, archive/restore), secure
   edit-saved-QR via `/create?id=` (server-verified ownership), open-redirect guard
   (`lib/safe-redirect.ts`), draft-only storage cleanup on replace/remove. Live on
   Vercel at **the-qr-gate.vercel.app** (Seleem's project). Stripe is optional:
   `getStripe()` is lazy, the webhook returns 503 unconfigured, so the app builds
   and runs with no Stripe env. To re-verify Supabase later: `pnpm verify:supabase`.

---

## Build flow — do these in order
> Tick the matching gate in `PROJECT.md` as you finish each step. Never skip a 🔒.
> Claude **cannot** create external accounts — when a step needs one, ask the
> human and paste the IDs/keys back; never invent them.

### 1 · Scope it  → PROJECT.md `1 Scoped`
- Write the core-80% feature list from the incumbent's PUBLIC docs (never copy their code/marks/copy/assets).
- **Verify the incumbent's current price** with a dated source; set ours ≈1/2, rounded. Record both in `PROJECT.md`.
- Choose the original brand name + domain.

### 2 · Clone the template
- `cp -R _template <codename>` → `cd <codename>` → `pnpm install`
- `cp .env.example .env.local` (fill values in as accounts come online)

### 3 · Brand, metadata & content  (the "reskin")
- **`lib/site.ts`** — name, domain, url, tagline, description; the `incumbent` block (name, price, source, date); `pricing` (amount ≈1/2, trialDays); `comparison.rows`; `alternatives[]` (the "<Incumbent> alternative" pages). KEEP `site.halfstack` (endorser → tryhalfstack.com) and `site.email` (info@tryhalfstack.com).
- **`lib/landing.ts`** — features (the rebuilt 80%), how-it-works steps, FAQ, social-proof line, plan includes.
- **`app/icon.svg`** — replace with THIS product's own favicon/mark (not the Halfstack X).
- Metadata, OG, sitemap, footer, and comparison pages all populate from the above — no layout edits needed unless the product genuinely calls for new sections. Preview now with `pnpm dev` (placeholder env is fine for the marketing site).

### 4 · Provision the 5 accounts  (HUMAN — ask, then record)
- Gmail `halfstack.<codename>@gmail.com` → Supabase account + project → domain → Stripe account (in the Halfstack org) → Vercel project (Root Directory = `<codename>`).
- Non-secret refs (Supabase project ref/URL, Stripe `acct_…`, domain) → `PROJECT.md`. Logins/keys → shared Apple Note. Runtime keys → `.env.local` (dev) + Vercel env (prod). **Never commit secrets.**

### 5 · Auth
- Email + password is already wired. With real Supabase keys, verify sign-up → email confirm → sign-in → sign-out → reset.
- In Supabase: set Site URL + redirect URLs to the domain; point Auth emails at **Resend** (custom SMTP, per-app `RESEND_API_KEY`).

### 6 · Database + RLS  🔒
- Model the product schema as SQL in `supabase/migrations/` — **RLS on every table** (follow `0000_init.sql`: owner-only policies; service role writes only where needed). `pnpm db:push`.

### 7 · Build the core product (the 80%)
- Build the real feature(s) in `app/(app)/`. Server Components by default, RLS-scoped queries, shadcn-idiomatic, on the design system.
- **Every feature ships with its tests in the same step (see 🧪 Testing) — untested = unfinished.**

### 8 · Payments  🔒
- In Stripe: create the Product + Price; set `NEXT_PUBLIC_STRIPE_PRICE_ID` + keys.
- Verify the card-required free-trial Checkout → **webhook grants access** (never the redirect) → Billing Portal, end-to-end. Local: `pnpm stripe:listen`.

### 9 · Legal  🔒
- Replace the **Terms** + **Privacy** placeholders with real content. Keep the trademark disclaimer on comparison/alternative pages.

### 10 · Content & SEO
- Write 3–5 cornerstone blog posts in `lib/content.ts` — including the **"<Incumbent> alternative"** post — plus a few docs. The sitemap auto-tracks them.
- Confirm titles/descriptions, OG image, favicon. Vercel Analytics + Speed Insights are already in the layout.

### 11 · Launch  🔒 → deploy
- Pass every root §10 gate: RLS tested · no secrets in git · webhook signature verified · LIVE keys in prod (test keys out) · auth-protected routes · ToS + Privacy live · prices re-checked · **all test suites green in CI**.
- Set Vercel env (live), attach the domain, deploy. Upgrade Supabase to Pro if it'll have live users (no sleeping project).
- Flip `PROJECT.md` → `5 Launched ✅` and update `/PROJECTS.md`.

### 12 · Post-launch growth  → see `docs/GROWTH.md`
- Verify Google Search Console + Bing; submit the sitemap.
- List on AlternativeTo + SaaSHub + directories; do the Product Hunt launch.
- Seed `content-backlog.md` and turn on the scheduled blog agent (**≤ 2–3 posts/day**, quality over volume).

---

## 🧪 Testing — every feature ships with tests (HARD GATE)

**A feature is NOT complete until it has automated tests that would fail if a
future change broke it.** No regression-catching test → it's not done; don't mark
it shipped. This is how a 100-app portfolio stays maintainable: breakage is caught
in CI **at build time, never by a user complaint.**

**Stack (the same on every app):**
- **Vitest + React Testing Library** — units & integration (lib logic, components, server actions, route handlers).
- **Playwright** — end-to-end for the flows that cost money / data / access if broken.
- Tests run in **CI on every push & PR, and pre-deploy.** A red test **blocks the merge and the deploy** — never merge around it.

**What every feature MUST cover (not just the happy path):**
- **Unit** — pure logic: pricing math, formatters, `zod` schemas, utils. Include edge cases + failure paths.
- **Integration** — each **route handler & server action**: requires auth, validates input, enforces **RLS** (one user cannot read/write another's rows), returns the right errors. Mock Supabase/Stripe at the boundary.
- **Stripe webhook** — signature verified; each event type provisions/revokes access correctly; invalid/replayed events rejected. (Access is granted by the webhook, so this test is mandatory.)
- **E2E** — sign-up → email confirm → sign-in → sign-out → reset; card-required trial → checkout → **webhook grants access**; the core product's create/read/update/delete; protected routes redirect when logged out.
- **Regression** — every bug fix lands **with a test that fails without the fix.**

**Rules:**
- New endpoint / server action / page-with-logic → its tests are in the **same PR.** Review rejects PRs without them.
- Tests are **deterministic** — no real network, clocks, or randomness (mock/inject them).
- Coverage is a signal, not the target — prioritize the paths that lose **data, money, or auth.**

> Litmus test: if you can't name the test that would catch a regression in what
> you just built, it isn't finished — write it. If the test harness doesn't exist
> in this app yet, **ask Seleem to add it** (it's a template/global change — see ⛔ Scope Lock). Don't ship untested.

---

## Non-negotiables (inherited from root — never violate)
- Build to the **Halfstack design system**: ink primary, **rationed blue**, border-led surfaces, Geist + mono numerics.
- **RLS on every table** · **verified Stripe webhooks** (not redirects) · **no secrets in git** · service-role key server-only.
- Comparative claims are **truthful + sourced**; never copy the incumbent's marks/copy/assets. Flag anything legally close (root §12).
- **Scope lock — THIS folder only (see ⛔ above).** Never edit another app or any global/shared file in `/halfstack` (root `CLAUDE.md`/`PROJECTS.md`/`README`, `docs/`, `Halfstack Design System/`, `_template/`). Those are **Seleem's** — request the change, don't make it.
- **Tests are mandatory (see 🧪 Testing).** Every feature/endpoint ships with a suite that fails if a future change breaks it. No test → not complete; all suites green in CI before deploy.
- **No one-off components.** Need a UI component that isn't in `components/` or the Halfstack Design System? Don't build a custom one here — **ask Seleem to add it to `_template/` + the design system** so every app shares it (root §16).

## App-specific notes
- **Extra deps:** `qr-code-styling` (the real QR renderer/exporter — client-only, loaded
  with `next/dynamic` + `ssr: false`); `vitest` (app-local test harness, same pattern as
  deadbolt — not added to `_template`).
- **The homepage IS the generator** (Step 1 — Select QR Type). There is deliberately no
  separate marketing homepage yet; the template's marketing pages (pricing, legal, blog…)
  still exist at their own routes.
- **QR engine seam:** everything QR lives in `lib/qr/` — `registry.ts` is the single
  source of truth for the 16 types (names, descriptions, icons, categories, defaults).
  Never duplicate type metadata in components.
- **Security notes:** the WiFi password is never persisted (memory only — draft
  persistence redacts it and its generated payload) and never logged. Drafts live in
  `sessionStorage` under `the-qr-gate:draft:v1` (old `qraft:draft:v1` drafts
  migrate on first load).
