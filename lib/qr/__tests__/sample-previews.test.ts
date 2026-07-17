import { describe, expect, it } from "vitest";
import { requiresPublishing } from "../payloads";
import { QR_TYPES } from "../registry";
import { sampleContentFor } from "../sample-previews";
import { validateContent } from "../validation";

describe("hover sample previews", () => {
  it("provides a sample for every one of the 16 QR types", () => {
    for (const def of QR_TYPES) {
      const sample = sampleContentFor(def.id);
      expect(sample, `sample for ${def.id}`).toBeTruthy();
      expect(sample.type, `sample.type for ${def.id}`).toBe(def.id);
      expect(sample.data, `sample.data for ${def.id}`).toBeTruthy();
    }
  });

  it("every sample is realistic enough to pass its content schema", () => {
    // Sample data should be as complete as real user input — this guards
    // against a preview that renders empty/placeholder states. Sample
    // asset ids are illustrative (not real uploads), so swap them for
    // valid UUIDs to validate the rest of the content shape.
    const uuid = "11111111-1111-4111-8111-111111111111";
    for (const def of QR_TYPES) {
      const withRealAssetIds = JSON.parse(
        JSON.stringify(sampleContentFor(def.id), (key, value) => (key === "assetId" ? uuid : value)),
      );
      const result = validateContent(withRealAssetIds);
      expect(result.valid, `${def.id} sample invalid: ${JSON.stringify(result.fieldErrors)}`).toBe(true);
    }
  });

  it("samples reuse the same hosted/direct classification as real content", () => {
    // Sanity: sample content flows through the exact same engine, so a
    // hosted-type sample is still classified hosted (never accidentally
    // treated as a direct payload).
    expect(requiresPublishing(sampleContentFor("links"))).toBe(true);
    expect(requiresPublishing(sampleContentFor("website"))).toBe(false);
    expect(requiresPublishing(sampleContentFor("whatsapp"))).toBe(false);
    expect(requiresPublishing(sampleContentFor("coupon"))).toBe(true);
  });

  it("image-backed samples carry a self-contained data-URI preview", () => {
    const links = sampleContentFor("links");
    if (links.type !== "links") throw new Error("unreachable");
    expect(links.data.image?.previewUrl).toMatch(/^data:image\/svg\+xml,/);
  });
});
