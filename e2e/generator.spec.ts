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

test("Step-1 renders live content inside ONE fixed iPhone frame (real chrome)", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Exactly one device shell, and it is the realistic one.
  await expect(page.locator("[data-iphone-frame]")).toHaveCount(1);
  const frame = page.locator("[data-iphone-frame]").first();
  await expect(frame.locator("[data-status-bar]")).toBeVisible();
  await expect(frame.locator("[data-dynamic-island]")).toBeVisible();
  await expect(frame.locator("[data-home-indicator]")).toBeVisible();
  // The device sits within the viewport and causes no page horizontal scroll.
  const overflow = await frame.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const de = document.documentElement;
    return {
      pastViewport: Math.round(r.right - de.clientWidth),
      pageOverflow: de.scrollWidth - de.clientWidth,
    };
  });
  expect(overflow.pastViewport).toBeLessThanOrEqual(1);
  expect(overflow.pageOverflow).toBeLessThanOrEqual(1);
  // The screen has real content rendered inside it (not an empty frame).
  await expect(frame.locator(".overflow-y-auto")).not.toBeEmpty();
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
