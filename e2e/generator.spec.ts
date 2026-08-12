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
