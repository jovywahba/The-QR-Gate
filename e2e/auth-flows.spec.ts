import { expect, test } from "@playwright/test";

/**
 * Auth surface + redirect restoration.
 *
 * The PUBLIC structure tests run everywhere (no session needed). The
 * AUTHENTICATED block only runs when AUTH_STATE points at a Playwright
 * storageState JSON for a seeded, disposable test user — the agent can't
 * create accounts or sign in, so the owner seeds a session and runs:
 *   AUTH_STATE=./e2e/.state/user.json BASE_URL=… pnpm test:e2e auth-flows
 * Without AUTH_STATE those tests skip (never fail) so CI stays green.
 */

test.describe("public auth pages render the expected controls", () => {
  test("sign-in has email + password + Google", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });

  test("sign-up is reachable and has the account fields", async ({ page }) => {
    await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("forgot-password asks for an email (reset-link flow)", async ({ page }) => {
    await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });
});

test.describe("protected routes redirect anonymous users to sign-in (redirect preserved)", () => {
  for (const path of ["/dashboard", "/dashboard/qr-codes", "/dashboard/billing", "/dashboard/settings"]) {
    test(`${path} → /sign-in?redirect=${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/sign-in\?redirect=/);
      const url = new URL(page.url());
      expect(decodeURIComponent(url.searchParams.get("redirect") ?? "")).toBe(path);
    });
  }
});

// ────────────────────────────────────────────────────────────────────
// AUTHENTICATED — only runs with a seeded storageState (owner-provided).
// ────────────────────────────────────────────────────────────────────
const AUTH_STATE = process.env.AUTH_STATE;

test.describe("authenticated dashboard smoke (seeded session)", () => {
  test.skip(!AUTH_STATE, "set AUTH_STATE to a seeded storageState JSON to run these");
  test.use({ storageState: AUTH_STATE });

  test("dashboard loads for a signed-in user (no redirect)", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/sign-in/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("my QR codes list is reachable", async ({ page }) => {
    await page.goto("/dashboard/qr-codes", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/sign-in/);
  });

  test("billing page is reachable", async ({ page }) => {
    await page.goto("/dashboard/billing", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/sign-in/);
  });

  test("the admin surface stays hidden from a non-admin user (404)", async ({ page }) => {
    const res = await page.goto("/admin", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
  });
});
