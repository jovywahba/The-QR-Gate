#!/usr/bin/env node
// ───────────────────────────────────────────────────────────────
// Launch security gate — executable static verification.
//
//   node scripts/verify-launch-security.mjs
//
// Runs the security invariants that can be checked WITHOUT production
// credentials, and prints the ones that need the service-role key / an applied
// schema so a human runs them. Exits non-zero if any hard static check fails.
// No fake passes: a check either verifies something real or is reported as
// "manual / requires credentials".
// ───────────────────────────────────────────────────────────────
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const ROOT = process.cwd();
let failures = 0;
const pass = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail = (m) => {
  failures++;
  console.log(`  \x1b[31m✗ ${m}\x1b[0m`);
};
const info = (m) => console.log(`  \x1b[90m•\x1b[0m ${m}`);
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) {
    return e.stdout ?? "";
  }
}

// ── 1. Secret hygiene ────────────────────────────────────────────
section("Secret hygiene (git)");
{
  const ignored = sh("git check-ignore .env.local").trim();
  ignored === ".env.local" ? pass(".env.local is gitignored") : fail(".env.local is NOT gitignored");

  const trackedEnv = sh("git ls-files")
    .split("\n")
    .filter((f) => /(^|\/)\.env/.test(f) && !f.endsWith(".env.example"));
  trackedEnv.length === 0
    ? pass("no .env file (other than .env.example) is tracked")
    : fail(`tracked env files: ${trackedEnv.join(", ")}`);

  // .env.example must be keys-only (no `KEY=value`). Inline `# comments` after
  // an empty value are fine — strip them before checking.
  try {
    const ex = readFileSync(".env.example", "utf8");
    const withValues = ex.split("\n").filter((l) => {
      const noComment = l.replace(/#.*$/, "").trim();
      return /^[A-Z0-9_]+=.+\S/.test(noComment);
    });
    withValues.length === 0
      ? pass(".env.example contains keys only (no values)")
      : fail(`.env.example has values on: ${withValues.map((l) => l.split("=")[0]).join(", ")}`);
  } catch {
    info(".env.example not found (skipped)");
  }

  // No REAL secrets committed in tracked source. Require plausible key length
  // and exclude test fixtures (which legitimately use short placeholder prefixes).
  const patterns = [
    { rx: "sk_live_[A-Za-z0-9]{16,}", label: "Stripe live secret key" },
    { rx: "whsec_[A-Za-z0-9]{16,}", label: "Stripe webhook signing secret" },
    { rx: "SUPABASE_SERVICE_ROLE_KEY=eyJ[A-Za-z0-9._-]{20,}", label: "service-role JWT value" },
  ];
  let leak = false;
  for (const { rx, label } of patterns) {
    const hits = sh(
      `git grep -lE "${rx}" -- . ":(exclude).env.example" ":(exclude)**/*.test.ts" ":(exclude)**/__tests__/**"`,
    ).trim();
    if (hits) {
      leak = true;
      fail(`possible ${label} in: ${hits.replace(/\n/g, ", ")}`);
    }
  }
  if (!leak) pass("no real live-key / signing-secret values in tracked files");
}

// ── 2. Server secrets never reach the client bundle (leak check) ──
section("Server secrets never reach the client bundle");
{
  const files = globSync("{app,components,lib}/**/*.{ts,tsx}", { cwd: ROOT }).filter(
    (f) => !f.includes("__tests__"),
  );
  const SECRETS = /SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|createAdminClient/;
  const offenders = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    const isClient = /^\s*["']use client["']/m.test(src);
    if (isClient && SECRETS.test(src)) offenders.push(f);
  }
  offenders.length === 0
    ? pass("no client component references the service-role key, admin client, or Stripe secrets")
    : offenders.forEach((f) => fail(`client component touches a server secret: ${f}`));

  // The admin client itself must be server-only.
  try {
    const admin = readFileSync("lib/supabase/admin.ts", "utf8");
    /server-only/.test(admin)
      ? pass('lib/supabase/admin.ts imports "server-only"')
      : fail('lib/supabase/admin.ts does NOT import "server-only"');
  } catch {
    info("lib/supabase/admin.ts not found (skipped)");
  }
}

// ── 3. Admin authz is centralized + DB-enforced (static presence) ──
section("Admin authorization (static presence checks)");
{
  const guard = sh("git ls-files lib/admin/guard.ts").trim();
  guard ? pass("centralized admin guard exists (lib/admin/guard.ts)") : fail("no lib/admin/guard.ts");

  const migration = readFileSync("supabase/migrations/0006_admin_completion.sql", "utf8");
  /last active super admin/.test(migration)
    ? pass("last-super-admin guard present in migration 0006")
    : fail("last-super-admin guard missing from 0006");
  /security definer/i.test(migration) && /search_path = ''/.test(migration)
    ? pass("0006 functions are SECURITY DEFINER with locked search_path")
    : fail("0006 functions missing SECURITY DEFINER / search_path guard");
}

// ── 4. Checks that REQUIRE credentials / applied schema (manual) ──
section("Requires the service-role key + applied schema (run against prod)");
info("RLS enabled on every table (query pg_tables/pg_policy with the service role)");
info("User A cannot read User B's rows (throwaway-account cross-read test)");
info("Browser cannot grant admin / Pro / write audit rows (anon PostgREST attempts)");
info("Browser cannot insert scan/conversion events (anon insert must be denied)");
info("Stripe webhook signature verification is mandatory (POST unsigned → 400)");
info("Final-super-admin protection is atomic (concurrent demotions on live DB)");
info("→ These need SUPABASE_SERVICE_ROLE_KEY and migration 0006 applied; see PROJECT.md.");

// ── Result ───────────────────────────────────────────────────────
console.log("");
if (failures > 0) {
  console.log(`\x1b[31mLAUNCH SECURITY: ${failures} static check(s) FAILED\x1b[0m`);
  process.exit(1);
}
console.log("\x1b[32mLAUNCH SECURITY: all static checks passed\x1b[0m");
console.log("(credential-dependent checks above are listed for a human to run against prod)");
