import { describe, expect, it } from "vitest";
import { defaultDesign } from "../defaults";
import { qrHealth } from "../health";
import type { QRDesignOptions } from "../types";

const good: QRDesignOptions = {
  ...defaultDesign,
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
  gradientType: "none",
  margin: 4,
  errorCorrection: "H",
  logoDataUrl: null,
};

describe("qrHealth", () => {
  it("scores a clean high-contrast design Excellent + safe", () => {
    const r = qrHealth(good, { payload: "https://x.co/q/abc123" });
    expect(r.safe).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.status).toBe("Excellent");
    expect(r.guidance).toEqual([]);
  });

  it("flags very low contrast as Unsafe and NOT safe (blocks download)", () => {
    const r = qrHealth({ ...good, foregroundColor: "#EEEEEE" }, { payload: "x" });
    expect(r.safe).toBe(false);
    expect(r.status).toBe("Unsafe");
    expect(r.guidance).toContain("Increase the contrast between the code and its background.");
  });

  it("treats a logo without error-correction H as Unsafe", () => {
    const r = qrHealth(
      { ...good, logoDataUrl: "data:image/png;base64,AAAA", logoSize: 20, errorCorrection: "M" },
      { payload: "x" },
    );
    expect(r.safe).toBe(false);
    expect(r.guidance).toContain("Use error correction H when a logo is included.");
  });

  it("marks a known-broken destination Unsafe and asks to fix it", () => {
    const r = qrHealth(good, { payload: "x", destinationValid: false });
    expect(r.safe).toBe(false);
    expect(r.status).toBe("Unsafe");
    expect(r.guidance).toContain("Fix the destination URL.");
  });

  it("deducts for a small quiet zone but stays safe above the hard floor", () => {
    const r = qrHealth({ ...good, margin: 3 }, { payload: "x" });
    expect(r.safe).toBe(true);
    expect(r.score).toBeLessThan(100);
    expect(r.guidance).toContain("Increase the quiet-zone margin.");
  });

  it("penalizes very dense payloads", () => {
    const dense = qrHealth(good, { payload: "x".repeat(3000) });
    const light = qrHealth(good, { payload: "x".repeat(50) });
    expect(dense.score).toBeLessThan(light.score);
    expect(dense.guidance).toContain("Shorten the destination or use a hosted short link.");
  });

  it("always returns 0-100 and the heuristic disclaimer", () => {
    const r = qrHealth(good, { payload: "x" });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.disclaimer).toMatch(/heuristic/i);
  });
});
