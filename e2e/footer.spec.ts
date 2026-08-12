import { expect, test } from "@playwright/test";

/**
 * Exactly one footer per page. Guards the layout ownership: the marketing
 * layout and the generator layout each own a single SiteFooter, and no page
 * renders its own. Auth pages intentionally have none.
 */

const WITH_FOOTER = ["/", "/create", "/pricing", "/docs", "/blog", "/status", "/privacy", "/terms"];
const WITHOUT_FOOTER = ["/sign-in", "/sign-up"];

for (const path of WITH_FOOTER) {
  test(`${path} has exactly one footer`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("footer")).toHaveCount(1);
  });
}

for (const path of WITHOUT_FOOTER) {
  test(`${path} has no footer (auth screen)`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("footer")).toHaveCount(0);
  });
}

test("no duplicate footer after cross-group client navigation", async ({ page }) => {
  await page.goto("/pricing", { waitUntil: "domcontentloaded" });
  await expect(page.locator("footer")).toHaveCount(1);
  // marketing → generator (soft navigation)
  await page.locator("header").getByRole("link", { name: "QR Generator" }).click();
  await expect(page).toHaveURL(/theqrgate\.com\/$|\/$/);
  await expect(page.locator("footer")).toHaveCount(1);
  // generator → marketing (back into pricing)
  await page.locator("header").getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.locator("footer")).toHaveCount(1);
});

test("the generator homepage renders exactly one <header>", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("header")).toHaveCount(1);
});
