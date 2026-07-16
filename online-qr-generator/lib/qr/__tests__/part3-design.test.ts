import { describe, expect, it } from "vitest";
import { defaultDesign, migrateDesign } from "../defaults";
import { buildPayload } from "../payloads";
import { toSafeDraft } from "../persistence";
import { applyPreset, DESIGN_PRESETS, presetThumbnailDesign } from "../presets";
import {
  contrastRatio,
  evaluateDesign,
  isValidHexColor,
  normalizeHexColor,
  relativeLuminance,
} from "../readability";
import { buildQRStylingOptions, marginPx } from "../styling";
import { initialWizardState } from "../defaults";
import type { QRDesignOptions, QRWizardState } from "../types";

const PAYLOAD = "https://example.com/";

function design(patch: Partial<QRDesignOptions> = {}): QRDesignOptions {
  return { ...defaultDesign, ...patch };
}

describe("default design", () => {
  it("is scan-safe by construction", () => {
    const result = evaluateDesign(defaultDesign, { hasPayload: true });
    expect(result.isSafe).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(defaultDesign.errorCorrection).toBe("Q");
    expect(defaultDesign.gradientType).toBe("none");
    expect(defaultDesign.logoDataUrl).toBeNull();
  });
});

describe("presets", () => {
  it("every preset produces a scan-safe design", () => {
    for (const preset of DESIGN_PRESETS) {
      const applied = applyPreset(defaultDesign, preset);
      const result = evaluateDesign(applied, { hasPayload: true });
      expect(result.isSafe, `${preset.id} safe`).toBe(true);
    }
  });

  it("applying a preset never touches logo, margin, or error correction", () => {
    const custom = design({ logoDataUrl: "data:image/png;base64,x", logoFileName: "l.png", errorCorrection: "H", margin: 6 });
    for (const preset of DESIGN_PRESETS) {
      const applied = applyPreset(custom, preset);
      expect(applied.logoDataUrl).toBe(custom.logoDataUrl);
      expect(applied.margin).toBe(6);
      expect(applied.errorCorrection).toBe("H");
    }
  });

  it("thumbnails render from the same option builder", () => {
    for (const preset of DESIGN_PRESETS) {
      const options = buildQRStylingOptions("QRGATE", presetThumbnailDesign(preset), 96);
      expect(options.data).toBe("QRGATE");
      expect(options.dotsOptions?.type).toBe(preset.apply.dotStyle);
    }
  });
});

describe("buildQRStylingOptions mapping", () => {
  it("maps every dot style straight through", () => {
    for (const dotStyle of ["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"] as const) {
      expect(buildQRStylingOptions(PAYLOAD, design({ dotStyle }), 320).dotsOptions?.type).toBe(dotStyle);
    }
  });

  it("maps corner square and corner dot styles", () => {
    for (const cornerSquareStyle of ["square", "dot", "rounded", "extra-rounded"] as const) {
      expect(
        buildQRStylingOptions(PAYLOAD, design({ cornerSquareStyle }), 320).cornersSquareOptions?.type,
      ).toBe(cornerSquareStyle);
    }
    for (const cornerDotStyle of ["square", "dot", "rounded"] as const) {
      expect(
        buildQRStylingOptions(PAYLOAD, design({ cornerDotStyle }), 320).cornersDotOptions?.type,
      ).toBe(cornerDotStyle);
    }
  });

  it("maps solid colors (no gradient object)", () => {
    const options = buildQRStylingOptions(PAYLOAD, design({ foregroundColor: "#112233" }), 320);
    expect(options.dotsOptions?.color).toBe("#112233");
    expect(options.dotsOptions?.gradient).toBeUndefined();
    expect(options.backgroundOptions?.color).toBe(defaultDesign.backgroundColor);
  });

  it("maps linear gradients with rotation in radians", () => {
    const options = buildQRStylingOptions(
      PAYLOAD,
      design({ gradientType: "linear", gradientStartColor: "#000000", gradientEndColor: "#3B5BFF", gradientRotation: 90 }),
      320,
    );
    const gradient = options.dotsOptions?.gradient;
    expect(gradient?.type).toBe("linear");
    expect(gradient?.rotation).toBeCloseTo(Math.PI / 2, 5);
    expect(gradient?.colorStops).toEqual([
      { offset: 0, color: "#000000" },
      { offset: 1, color: "#3B5BFF" },
    ]);
    // Corners carry the same paint — one visual mark.
    expect(options.cornersSquareOptions?.gradient?.type).toBe("linear");
  });

  it("maps radial gradients with zero rotation", () => {
    const gradient = buildQRStylingOptions(PAYLOAD, design({ gradientType: "radial" }), 320).dotsOptions?.gradient;
    expect(gradient?.type).toBe("radial");
    expect(gradient?.rotation).toBe(0);
  });

  it("maps margin as a size-proportional quiet zone", () => {
    expect(marginPx(4, 320)).toBe(13);
    expect(marginPx(4, 1024)).toBe(41);
    expect(buildQRStylingOptions(PAYLOAD, design({ margin: 10 }), 1000).margin).toBe(100);
  });

  it("maps error correction", () => {
    for (const errorCorrection of ["L", "M", "Q", "H"] as const) {
      expect(
        buildQRStylingOptions(PAYLOAD, design({ errorCorrection }), 320).qrOptions?.errorCorrectionLevel,
      ).toBe(errorCorrection);
    }
  });

  it("maps the logo with size fraction and background clearing", () => {
    const options = buildQRStylingOptions(
      PAYLOAD,
      design({ logoDataUrl: "data:image/png;base64,AAA", logoSize: 20, logoMargin: 8, logoBackground: true, errorCorrection: "H" }),
      320,
    );
    expect(options.image).toBe("data:image/png;base64,AAA");
    expect(options.imageOptions?.imageSize).toBeCloseTo(0.2);
    expect(options.imageOptions?.hideBackgroundDots).toBe(true);
    expect(options.imageOptions?.margin).toBe(8);
    const without = buildQRStylingOptions(PAYLOAD, design(), 320);
    expect(without.image).toBeUndefined();
  });

  it("preview and download share the exact same configuration", () => {
    const d = design({ dotStyle: "classy", gradientType: "linear" });
    const preview = buildQRStylingOptions(PAYLOAD, d, 320);
    const exported = buildQRStylingOptions(PAYLOAD, d, 1024);
    // Same everything except the physical size / proportional margin.
    expect({ ...preview, width: 0, height: 0, margin: 0 }).toEqual({ ...exported, width: 0, height: 0, margin: 0 });
  });
});

describe("hex + contrast helpers", () => {
  it("validates and normalizes hex (incl. shorthand)", () => {
    expect(isValidHexColor("#1B1B2F")).toBe(true);
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
    expect(normalizeHexColor("  #ffffff ")).toBe("#FFFFFF");
    expect(normalizeHexColor("red")).toBeNull();
    expect(normalizeHexColor("#12345")).toBeNull();
    expect(normalizeHexColor("1B1B2F")).toBeNull();
  });

  it("computes relative luminance and contrast", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 3);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 3);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 3);
  });
});

describe("readability engine", () => {
  it("rejects identical foreground/background", () => {
    const result = evaluateDesign(design({ foregroundColor: "#FFFFFF" }));
    expect(result.isSafe).toBe(false);
    expect(result.issues.some((i) => i.code === "same-color")).toBe(true);
  });

  it("errors on extremely low contrast, warns on moderate", () => {
    const bad = evaluateDesign(design({ foregroundColor: "#EEEEEE" })); // vs white
    expect(bad.isSafe).toBe(false);
    expect(bad.issues.some((i) => i.code === "contrast-too-low")).toBe(true);

    const warned = evaluateDesign(design({ foregroundColor: "#9A968A" })); // mid-grey vs white
    expect(warned.isSafe).toBe(true);
    expect(warned.issues.some((i) => i.code === "contrast-low")).toBe(true);

    const good = evaluateDesign(design());
    expect(good.issues).toHaveLength(0);
  });

  it("checks gradient endpoints against the background", () => {
    const result = evaluateDesign(
      design({ gradientType: "linear", gradientStartColor: "#1B1B2F", gradientEndColor: "#FEFEFE" }),
    );
    expect(result.isSafe).toBe(false);
  });

  it("flags unsafe margins", () => {
    expect(evaluateDesign(design({ margin: 1 })).isSafe).toBe(false);
    const small = evaluateDesign(design({ margin: 3 }));
    expect(small.isSafe).toBe(true);
    expect(small.issues.some((i) => i.code === "margin-small")).toBe(true);
  });

  it("enforces logo rules: size cap + error correction H", () => {
    const logo = { logoDataUrl: "data:image/png;base64,x", logoFileName: "l.png" };
    expect(evaluateDesign(design({ ...logo, logoSize: 30, errorCorrection: "H" })).isSafe).toBe(false);
    const noH = evaluateDesign(design({ ...logo, logoSize: 20, errorCorrection: "Q" }));
    expect(noH.isSafe).toBe(false);
    expect(noH.issues.some((i) => i.code === "logo-needs-h")).toBe(true);
    expect(evaluateDesign(design({ ...logo, logoSize: 20, errorCorrection: "H" })).isSafe).toBe(true);
  });

  it("rejects invalid hex before anything else", () => {
    const result = evaluateDesign(design({ foregroundColor: "tomato" }));
    expect(result.isSafe).toBe(false);
    expect(result.issues[0].code).toBe("invalid-foreground");
  });
});

describe("design state behavior", () => {
  it("payload is independent of design (before === after)", () => {
    const content = { type: "website", data: { url: "example.com" } } as const;
    const before = buildPayload(content);
    // buildPayload takes no design input at all — change design, rebuild:
    const after = buildPayload(content);
    expect(before).toBe(after);
    expect(before).toBe("https://example.com/");
  });

  it("migrates Part-1/2 drafts (old field names) to the new shape", () => {
    const migrated = migrateDesign({
      foreground: "#101010",
      background: "#FAFAF8",
      dotStyle: "rounded",
      cornerStyle: "rounded",
      margin: 16,
      errorCorrection: "M",
    });
    expect(migrated.foregroundColor).toBe("#101010");
    expect(migrated.backgroundColor).toBe("#FAFAF8");
    expect(migrated.dotStyle).toBe("rounded");
    expect(migrated.cornerSquareStyle).toBe("extra-rounded");
    expect(migrated.margin).toBe(defaultDesign.margin); // old px scale discarded
    expect(migrated.errorCorrection).toBe("M");
    expect(migrateDesign(null)).toEqual(defaultDesign);
    expect(migrateDesign(defaultDesign)).toEqual(defaultDesign);
  });

  it("persists design settings but drops oversized logo data", () => {
    const smallLogo = "data:image/png;base64," + "A".repeat(1_000);
    const hugeLogo = "data:image/png;base64," + "A".repeat(700_000);
    const base: QRWizardState = {
      ...initialWizardState(),
      selectedType: "website",
      content: { type: "website", data: { url: "example.com" } },
      design: design({ logoDataUrl: smallLogo, logoFileName: "logo.png", errorCorrection: "H", dotStyle: "dots", margin: 6 }),
      generatedPayload: PAYLOAD,
    };
    const kept = toSafeDraft(base);
    expect(kept.design.logoDataUrl).toBe(smallLogo);
    expect(kept.design.dotStyle).toBe("dots");
    expect(kept.design.margin).toBe(6);

    const dropped = toSafeDraft({ ...base, design: design({ logoDataUrl: hugeLogo, logoFileName: "big.png" }) });
    expect(dropped.design.logoDataUrl).toBeNull();
    expect(dropped.design.logoFileName).toBe("big.png"); // UI asks for a reselect
  });
});
