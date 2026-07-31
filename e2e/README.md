# E2E tests (Playwright)

Playwright is **not installed by default** (keeps the base install lean and the
`pnpm build` on Vercel fast). Enable it, then run:

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
# deterministic gate specs — no auth, run against local dev or prod:
BASE_URL=http://localhost:3000 pnpm test:e2e
BASE_URL=https://www.theqrgate.com pnpm test:e2e
```

## What runs today (deterministic, no seeded data)

`admin-gate.spec.ts` — asserts the **fail-closed** security behavior, so it needs
no accounts:

- every `/admin/*` route returns **404** for anonymous users (the guard hides
  the admin surface's existence)
- protected `/dashboard/*` routes redirect anonymous users to `/sign-in`
- public routes (`/`, `/pricing`, `/privacy`, `/terms`, `/status`,
  `/design-preview`) return **200**
- `POST /api/stripe/webhook` unsigned → **400** (signature enforced)

## What still needs a seeded environment (next increment)

The role-matrix + QR-lifecycle specs the spec asks for require:

1. **Migration `0006` applied** (`supabase/SUPABASE_ADMIN_COMPLETION.sql`).
2. The **super_admin bootstrap** row (see `PROJECT.md`).
3. **Four seeded admin accounts** (super_admin / admin / support / analyst) plus
   a normal user and a Pro user, each captured as a Playwright `storageState`
   fixture — pointed at an **isolated test project**, never production data.

Then add specs for: normal-user denied, analyst read-only, support restrictions,
admin mutation, super_admin team management, **final-super-admin protection**,
user/QR search, audited suspension / QR pause / entitlement, audit
filtering/pagination, analytics permissions, and the full QR publish → export →
decode → pause → version-restore lifecycle. Keep them deterministic (seed the
data each run; never rely on live production rows).
