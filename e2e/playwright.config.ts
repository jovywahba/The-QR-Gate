import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for The QR Gate critical E2E.
 *
 * Run against a local dev server (default) or any deployed URL:
 *   pnpm add -D @playwright/test && pnpm exec playwright install chromium
 *   BASE_URL=http://localhost:3000 pnpm test:e2e      # local
 *   BASE_URL=https://www.theqrgate.com pnpm test:e2e  # prod (read-only specs only)
 *
 * The admin-gate spec is deterministic and needs NO auth (it asserts the
 * fail-closed guard). The role-matrix / QR-lifecycle specs need seeded test
 * accounts + migration 0006 applied + the super_admin bootstrap — see README.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
