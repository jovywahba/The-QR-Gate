import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "../../safe-redirect";
import { defaultDesign } from "../defaults";
import { exportFileName } from "../download";
import { buildPayload, requiresPublishing } from "../payloads";
import { defaultContentFor } from "../defaults";
import { buildQRExportOptions, buildQRStylingOptions, PNG_EXPORT_SIZES } from "../styling";

const PAYLOAD = "https://example.com/";

describe("export options (single pipeline)", () => {
  it("offers exactly 512/1024/2048 PNG sizes", () => {
    expect([...PNG_EXPORT_SIZES]).toEqual([512, 1024, 2048]);
  });

  it("renders each PNG size at its actual resolution with identical design", () => {
    for (const size of PNG_EXPORT_SIZES) {
      const options = buildQRExportOptions(PAYLOAD, defaultDesign, size, "png");
      expect(options.width).toBe(size);
      expect(options.height).toBe(size);
      expect(options.type).toBe("canvas");
    }
  });

  it("SVG export uses the vector draw type with the same design mapping", () => {
    const svg = buildQRExportOptions(PAYLOAD, defaultDesign, 1024, "svg");
    const png = buildQRExportOptions(PAYLOAD, defaultDesign, 1024, "png");
    expect(svg.type).toBe("svg");
    expect({ ...svg, type: null }).toEqual({ ...png, type: null });
    // And both equal the on-screen renderer's mapping:
    expect({ ...buildQRStylingOptions(PAYLOAD, defaultDesign, 1024), type: null }).toEqual({
      ...png,
      type: null,
    });
  });

  it("names files per format", () => {
    expect(exportFileName("business", "svg", new Date(2026, 6, 16))).toBe("the-qr-gate-business-2026-07-16.svg");
    expect(exportFileName("coupon", "png", new Date(2026, 6, 16))).toBe("the-qr-gate-coupon-2026-07-16.png");
  });
});

describe("download gating logic", () => {
  it("hosted types have no local payload before publishing (download blocked)", () => {
    for (const type of ["pdf", "links", "business", "images", "social", "apps", "coupon"] as const) {
      const content = defaultContentFor(type);
      expect(requiresPublishing(content)).toBe(true);
      expect(buildPayload(content)).toBe("");
    }
  });

  it("direct types download without publishing", () => {
    expect(buildPayload({ type: "website", data: { url: "example.com" } })).toBe("https://example.com/");
  });
});

describe("open-redirect protection", () => {
  it("allows internal paths only", () => {
    expect(safeRedirectPath("/create?type=pdf&step=4", "/dashboard")).toBe("/create?type=pdf&step=4");
    expect(safeRedirectPath("/dashboard/qr-codes", "/")).toBe("/dashboard/qr-codes");
  });

  it("rejects external and scheme-relative URLs", () => {
    expect(safeRedirectPath("https://evil.example", "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example", "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("javascript:alert(1)", "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example", "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath(null, "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("", "/dashboard")).toBe("/dashboard");
  });
});
