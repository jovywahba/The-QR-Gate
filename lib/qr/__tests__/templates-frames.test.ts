import { describe, expect, it } from "vitest";
import { artworkDimensions, computeArtwork, frameColorsFor } from "../composition";
import { defaultDesign, migrateDesign } from "../defaults";
import {
  defaultFrameTextFor,
  getFrame,
  isFrameId,
  MAX_FRAME_TEXT,
  normalizeFrameText,
  qrFrames,
  resolveFrameText,
  type FramePrimitive,
} from "../frames";
import { QR_TYPES } from "../registry";
import {
  applyTemplate,
  getTemplate,
  isTemplateModified,
  qrTemplates,
  templateThumbnailDesign,
} from "../templates";
import type { QRDesignOptions } from "../types";

const COLORS = { background: "#FFFFFF", foreground: "#1B1B2F", text: "#FFFFFF" };
const SAMPLE = "SCAN ME";

/* ── registries ── */

describe("template registry", () => {
  it("has at least 16 templates with unique ids", () => {
    expect(qrTemplates.length).toBeGreaterThanOrEqual(16);
    const ids = qrTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only ever references frames that exist", () => {
    for (const t of qrTemplates) {
      if (t.apply.frameId) expect(isFrameId(t.apply.frameId), `${t.id} → ${t.apply.frameId}`).toBe(true);
    }
  });

  it("only patches known design fields (never content or destination)", () => {
    for (const t of qrTemplates) {
      for (const key of Object.keys(t.apply)) {
        expect(key in defaultDesign, `${t.id}.${key}`).toBe(true);
      }
    }
  });

  it("is dark-on-light everywhere (inverted codes scan poorly)", () => {
    for (const t of qrTemplates) {
      const bg = t.apply.backgroundColor ?? defaultDesign.backgroundColor;
      expect(bg.toUpperCase(), t.id).not.toBe("#000000");
    }
  });
});

describe("frame registry", () => {
  it("has at least 12 frames with unique ids and None first", () => {
    expect(qrFrames.length).toBeGreaterThanOrEqual(12);
    const ids = qrFrames.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(qrFrames[0].id).toBe("none");
  });

  it("resolves unknown ids back to None", () => {
    expect(getFrame("does-not-exist").id).toBe("none");
    expect(getFrame(null).id).toBe("none");
  });
});

/* ── None behaviour ── */

describe("None template + None frame", () => {
  it("the None frame is a plain QR with no extra canvas", () => {
    const layout = getFrame("none").layout({ qrSize: 500, text: "", colors: COLORS });
    expect(layout.width).toBe(500);
    expect(layout.height).toBe(500);
    expect(layout.qr).toEqual({ x: 0, y: 0, size: 500 });
    expect(layout.back).toHaveLength(0);
    expect(layout.front).toHaveLength(0);
  });

  it("default design is template None + frame none", () => {
    expect(defaultDesign.templateId).toBeNull();
    expect(defaultDesign.frameId).toBe("none");
  });
});

/* ── applying a template ── */

describe("applying a template", () => {
  it("sets templateId and never touches logo or frame text", () => {
    const template = getTemplate("ocean")!;
    const patch = applyTemplate(defaultDesign, template);
    expect(patch.templateId).toBe("ocean");
    expect(patch).not.toHaveProperty("logoDataUrl");
    expect(patch).not.toHaveProperty("frameText");
  });

  it("keeps the current frame when the template doesn't define one", () => {
    const design: QRDesignOptions = { ...defaultDesign, frameId: "scan-bottom" };
    const patch = applyTemplate(design, getTemplate("ocean")!);
    expect(patch.frameId).toBeUndefined(); // → the existing frame survives
  });

  it("applies the template's own frame when it defines one", () => {
    expect(applyTemplate(defaultDesign, getTemplate("corporate")!).frameId).toBe("border");
  });

  it("derives coherent frame colors from the new palette", () => {
    const patch = applyTemplate(defaultDesign, getTemplate("gold")!);
    expect(patch.frameBackground).toBe(patch.backgroundColor);
    expect(patch.frameForeground).toBe(patch.gradientStartColor);
  });

  it("flags a template as modified only after a manual edit", () => {
    const applied = { ...defaultDesign, ...applyTemplate(defaultDesign, getTemplate("ocean")!) };
    expect(isTemplateModified(applied)).toBe(false);
    expect(isTemplateModified({ ...applied, dotStyle: "square" })).toBe(true);
  });

  it("thumbnails render the style without a frame or logo", () => {
    const thumb = templateThumbnailDesign(getTemplate("corporate")!);
    expect(thumb.frameId).toBe("none");
    expect(thumb.logoDataUrl).toBeNull();
  });
});

/* ── CTA text ── */

describe("frame CTA text", () => {
  it("suggests a sensible default for every QR type", () => {
    for (const t of QR_TYPES) {
      expect(defaultFrameTextFor(t.id).length, t.id).toBeGreaterThan(0);
    }
    expect(defaultFrameTextFor("menu")).toBe("VIEW MENU");
    expect(defaultFrameTextFor("vcard")).toBe("SAVE CONTACT");
    expect(defaultFrameTextFor("wifi")).toBe("CONNECT TO WIFI");
  });

  it("clamps and tidies custom text", () => {
    expect(normalizeFrameText("  scan   me  ")).toBe("scan me");
    expect(normalizeFrameText("x".repeat(80))).toHaveLength(MAX_FRAME_TEXT);
  });

  it("prefers custom text, then the type default", () => {
    const frame = getFrame("scan-bottom");
    expect(resolveFrameText(frame, "MY TEXT", "menu")).toBe("MY TEXT");
    expect(resolveFrameText(frame, "", "menu")).toBe("VIEW MENU");
    expect(resolveFrameText(getFrame("none"), "MY TEXT", "menu")).toBe("");
  });
});

/* ── backward compatibility ── */

describe("saved-design compatibility", () => {
  it("a pre-frames saved design loads with frame none", () => {
    const legacy = {
      dotStyle: "dots",
      foregroundColor: "#112233",
      backgroundColor: "#FFFFFF",
      margin: 6,
      errorCorrection: "H",
    };
    const design = migrateDesign(legacy);
    expect(design.frameId).toBe("none");
    expect(design.templateId).toBeNull();
    expect(design.frameText).toBe("");
    expect(design.exportFit).toBe("square");
    // and the real design values still survive
    expect(design.dotStyle).toBe("dots");
    expect(design.foregroundColor).toBe("#112233");
  });

  it("restores a saved frame selection", () => {
    const design = migrateDesign({
      ...defaultDesign,
      frameId: "scan-bottom",
      frameText: "VIEW MENU",
      frameForeground: "#0E2440",
      templateId: "navy",
      exportFit: "frame",
    });
    expect(design.frameId).toBe("scan-bottom");
    expect(design.frameText).toBe("VIEW MENU");
    expect(design.frameForeground).toBe("#0E2440");
    expect(design.templateId).toBe("navy");
    expect(design.exportFit).toBe("frame");
  });
});

/* ── composition geometry ── */

function bbox(p: FramePrimitive): { x: number; y: number; w: number; h: number } | null {
  if (p.kind === "rect") return { x: p.x, y: p.y, w: p.w, h: p.h };
  if (p.kind === "circle") return { x: p.cx - p.r, y: p.cy - p.r, w: p.r * 2, h: p.r * 2 };
  if (p.kind === "line") {
    const pad = p.strokeWidth / 2;
    return {
      x: Math.min(p.x1, p.x2) - pad,
      y: Math.min(p.y1, p.y2) - pad,
      w: Math.abs(p.x2 - p.x1) + pad * 2,
      h: Math.abs(p.y2 - p.y1) + pad * 2,
    };
  }
  const w = p.text.length * p.size * 0.6;
  const x = p.anchor === "middle" ? p.x - w / 2 : p.anchor === "end" ? p.x - w : p.x;
  return { x, y: p.y - p.size / 2, w, h: p.size };
}

const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
  a.x < b.x + b.w - 0.01 && a.x + a.w > b.x + 0.01 && a.y < b.y + b.h - 0.01 && a.y + a.h > b.y + 0.01;

const contains = (outer: { x: number; y: number; w: number; h: number }, inner: typeof outer) =>
  outer.x <= inner.x && outer.y <= inner.y &&
  outer.x + outer.w >= inner.x + inner.w && outer.y + outer.h >= inner.y + inner.h;

describe("quiet zone / scan safety", () => {
  it("no frame ever paints over the QR", () => {
    for (const frame of qrFrames) {
      const layout = frame.layout({ qrSize: 1000, text: SAMPLE, colors: COLORS });
      const qr = { x: layout.qr.x, y: layout.qr.y, w: layout.qr.size, h: layout.qr.size };
      for (const p of layout.front) {
        const box = bbox(p)!;
        if (p.kind === "rect" && !p.fill && p.stroke) {
          // an outline must sit fully OUTSIDE the code
          expect(contains(box, qr), `${frame.id}: outline crosses the QR`).toBe(true);
        } else {
          expect(overlaps(box, qr), `${frame.id}: ${p.kind} covers the QR`).toBe(false);
        }
      }
    }
  });

  it("keeps the QR inside the artwork for every frame", () => {
    for (const frame of qrFrames) {
      const l = frame.layout({ qrSize: 1000, text: SAMPLE, colors: COLORS });
      expect(l.qr.x).toBeGreaterThanOrEqual(0);
      expect(l.qr.y).toBeGreaterThanOrEqual(0);
      expect(l.qr.x + l.qr.size, frame.id).toBeLessThanOrEqual(l.width);
      expect(l.qr.y + l.qr.size, frame.id).toBeLessThanOrEqual(l.height);
    }
  });
});

describe("artwork sizing", () => {
  it("square fit keeps every frame inside the requested square", () => {
    for (const frame of qrFrames) {
      const design: QRDesignOptions = { ...defaultDesign, frameId: frame.id, exportFit: "square" };
      const art = computeArtwork({ design, size: 1024, type: "menu" });
      expect(art.width, frame.id).toBe(1024);
      expect(art.height, frame.id).toBe(1024);
      expect(art.layout.width).toBeLessThanOrEqual(1024);
      expect(art.layout.height).toBeLessThanOrEqual(1024);
    }
  });

  it("fit-frame keeps the QR at full size and grows the canvas", () => {
    const design: QRDesignOptions = { ...defaultDesign, frameId: "scan-bottom", exportFit: "frame" };
    const art = computeArtwork({ design, size: 1024, type: "menu" });
    expect(art.layout.qr.size).toBe(1024);
    expect(art.height).toBeGreaterThan(1024);
    expect(artworkDimensions(design, 1024, "menu")).toEqual({ width: art.width, height: art.height });
  });

  it("with no frame the artwork is exactly the QR", () => {
    const art = computeArtwork({ design: defaultDesign, size: 512 });
    expect(art.width).toBe(512);
    expect(art.height).toBe(512);
    expect(art.layout.qr).toEqual({ x: 0, y: 0, size: 512 });
  });

  it("template + frame combine without losing either", () => {
    const design: QRDesignOptions = {
      ...defaultDesign,
      ...applyTemplate(defaultDesign, getTemplate("gold")!),
      frameId: "scan-bottom",
    };
    const art = computeArtwork({ design, size: 1024, type: "menu" });
    expect(art.frame.id).toBe("scan-bottom");
    expect(design.gradientStartColor).toBe("#C79A3A");
    expect(frameColorsFor(design).foreground).toBe("#C79A3A");
  });
});
