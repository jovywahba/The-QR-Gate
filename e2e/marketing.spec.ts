import { expect, test } from "@playwright/test";

/**
 * Public marketing regression — guards against the template-residue leaks the
 * production audit found (TODO price, "Incumbent" placeholder, fake seat
 * pricing, template legal notices). Read-only; runs against any deployment.
 */

const LEAKS = [
  "TODO",
  "Incumbent",
  "Template document",
  "to be confirmed",
  "Half the price",
  "$60",
  "$18,000",
  "per seat",
];

async function bodyText(page: import("@playwright/test").Page, path: string): Promise<string> {
  const res = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(res?.status(), `expected 200 for ${path}`).toBe(200);
  return (await page.locator("body").innerText()).trim();
}

test.describe("no public template-residue leaks", () => {
  for (const path of ["/", "/pricing", "/about", "/docs", "/blog", "/terms", "/privacy"]) {
    test(`${path} is free of placeholder/template strings`, async ({ page }) => {
      const text = await bodyText(page, path);
      for (const leak of LEAKS) {
        expect(text, `"${leak}" leaked on ${path}`).not.toContain(leak);
      }
    });
  }
});

test("pricing shows the real single-plan story", async ({ page }) => {
  const text = await bodyText(page, "/pricing");
  expect(text).toContain("One simple plan");
  expect(text).toMatch(/\$10/);
});

test("the retired competitor-comparison page is gone (404)", async ({ page }) => {
  const res = await page.goto("/alternatives/incumbent", { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBe(404);
});

test("terms is a real document, not a template stub", async ({ page }) => {
  const text = await bodyText(page, "/terms");
  expect(text).toContain("Agreement to terms");
  expect(text).not.toContain("Template document");
});
