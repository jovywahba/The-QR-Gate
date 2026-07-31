import { expect, test } from "@playwright/test";

/**
 * Deterministic admin-gate + auth-gate checks. These need NO authentication —
 * they assert the FAIL-CLOSED behavior, so they run against any deployment
 * (local dev or prod) without seeded data. Safe: read-only, no mutations.
 */

const ADMIN_ROUTES = [
  "/admin",
  "/admin/users",
  "/admin/qr-codes",
  "/admin/analytics",
  "/admin/subscriptions",
  "/admin/reports",
  "/admin/support",
  "/admin/security",
  "/admin/system-health",
  "/admin/audit",
  "/admin/team",
];

test.describe("admin surface is hidden from non-admins (fail-closed 404)", () => {
  for (const route of ADMIN_ROUTES) {
    test(`anonymous → ${route} returns 404`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `expected 404 for ${route}`).toBe(404);
    });
  }
});

test.describe("protected app routes redirect anonymous users to sign-in", () => {
  for (const route of ["/dashboard", "/dashboard/qr-codes", "/dashboard/billing", "/dashboard/settings"]) {
    test(`anonymous → ${route} lands on /sign-in`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/sign-in/);
    });
  }
});

test.describe("public routes are reachable", () => {
  for (const route of ["/", "/pricing", "/privacy", "/terms", "/status", "/design-preview"]) {
    test(`${route} returns 200`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `expected 200 for ${route}`).toBe(200);
    });
  }
});

test("the Stripe webhook rejects an unsigned POST (signature enforced)", async ({ request }) => {
  const res = await request.post("/api/stripe/webhook", { data: "{}" });
  expect(res.status()).toBe(400);
});
