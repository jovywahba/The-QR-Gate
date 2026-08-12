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

test("Step-1 sample preview is not cropped (shell aspect matches the artwork)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const img = page.locator('img[alt*="mobile destination preview"]').first();
  await expect(img).toBeVisible();
  const geom = await img.evaluate((el) => {
    const image = el as HTMLImageElement;
    const r = image.getBoundingClientRect();
    return {
      renderedAR: r.width / r.height,
      naturalAR: image.naturalWidth / image.naturalHeight,
      objectFit: getComputedStyle(image).objectFit,
    };
  });
  // The rendered box must share the image's own aspect ratio, so `cover`
  // fills it with nothing clipped. (Before the fix: box ≈ 0.462 vs image
  // ≈ 0.563 → ~20% of the width was cropped.)
  expect(Math.abs(geom.renderedAR - geom.naturalAR)).toBeLessThan(0.03);
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
