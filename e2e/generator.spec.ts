import { expect, test } from "@playwright/test";

/**
 * Generator-homepage regression — guards the live-QA fixes:
 *  1. The homepage carries the shared site footer (one product, not two).
 *  2. The Step-1 sample phone shows the supplied artwork uncropped — the
 *     phone-shell aspect matches the image, so object-cover no longer
 *     shaves ~20% off the sides of every type.
 *  3. No horizontal overflow at 320px (the narrowest common phone).
 * Read-only; runs against any deployment.
 */

test("homepage carries the shared footer (feels like one product)", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const footer = page.locator("footer");
  await expect(footer).toBeVisible();
  // Footer links back into the marketing site.
  await expect(footer.getByRole("link", { name: "Pricing" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Privacy" })).toBeVisible();
});

test("Step-1 sample renders inside ONE iPhone frame — uncropped, no clip", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // Exactly one device shell, with the realistic chrome.
  await expect(page.locator("[data-iphone-frame]")).toHaveCount(1);
  const frame = page.locator("[data-iphone-frame]").first();
  await expect(frame.locator("[data-status-bar]")).toBeVisible();
  await expect(frame.locator("[data-dynamic-island]")).toBeVisible();
  await expect(frame.locator("[data-home-indicator]")).toBeVisible();

  const img = frame.locator('img[alt*="mobile destination preview"]').first();
  await expect(img).toBeVisible();
  const geom = await img.evaluate((el) => {
    const image = el as HTMLImageElement;
    const r = image.getBoundingClientRect();
    const fr = (image.closest("[data-iphone-frame]") as HTMLElement).getBoundingClientRect();
    return {
      renderedAR: image.naturalWidth ? r.width / r.height : 0,
      naturalAR: image.naturalWidth ? image.naturalWidth / image.naturalHeight : 0,
      widthOverflow: r.width - fr.width,
    };
  });
  // Natural aspect (no crop/stretch), never wider than the phone.
  expect(Math.abs(geom.renderedAR - geom.naturalAR)).toBeLessThan(0.03);
  expect(geom.widthOverflow).toBeLessThanOrEqual(1);
});

test("the global navbar exists on the generator (one product)", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const header = page.locator("header").first();
  await expect(header.getByRole("link", { name: "QR Generator" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Pricing" })).toBeVisible();
});

test("Pricing navigates from the generator header", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("header").getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole("heading", { name: /one simple plan/i })).toBeVisible();
});

test("homepage has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    return { scrollW: de.scrollWidth, clientW: de.clientWidth };
  });
  expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);
});

// ── Deep linking: /create?type=<id> selects the type and opens Step 2 ──
for (const type of ["website", "pdf", "wifi", "business", "vcard", "menu"]) {
  test(`/create?type=${type} deep-links straight to Add Content (Step 2)`, async ({ page }) => {
    await page.goto(`/create?type=${type}`, { waitUntil: "domcontentloaded" });
    // Step 2's heading is "Add Content"; the Step-1 grid heading is "Select QR Type".
    await expect(page.getByRole("heading", { name: "Add Content" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Select QR Type" })).toHaveCount(0);
  });
}

test("an invalid ?type= safely falls back to the Step-1 type picker", async ({ page }) => {
  await page.goto("/create?type=definitely-not-a-real-type", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Select QR Type" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add Content" })).toHaveCount(0);
});

test("Step-1 QR Preview shows an honest empty state (no fake QR, no blue block)", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Switch to the QR Preview tab while no type is selected.
  await page.getByRole("tab", { name: "QR Preview" }).click();
  // No <canvas> is rendered (a real QR would draw one) — i.e. no fake code.
  await expect(page.locator("canvas")).toHaveCount(0);
  // The empty state names what to do next.
  await expect(page.getByText(/select a qr type/i).first()).toBeVisible();
});
