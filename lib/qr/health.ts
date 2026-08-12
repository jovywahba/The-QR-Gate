import {
  CONTRAST_ERROR_THRESHOLD,
  CONTRAST_WARNING_THRESHOLD,
  contrastRatio,
  evaluateDesign,
  isValidHexColor,
  MAX_LOGO_SIZE,
  MIN_MARGIN,
  RECOMMENDED_MARGIN,
} from "./readability";
import type { QRDesignOptions } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * QR Health Score — a real 0-100 readability heuristic (unit-tested).
 *
 * It weighs contrast, quiet zone, logo size, error correction, payload
 * density, framing, and destination validity. It is a HEURISTIC, not a
 * guarantee that every scanner will succeed — an independent decode is
 * the only proof (which the QA flow does on real renders).
 *
 * `safe` mirrors the readability engine's hard gate (+ destination), so
 * an Unsafe score still blocks download exactly as before.
 * ───────────────────────────────────────────────────────────────
 */

export type HealthStatus = "Excellent" | "Good" | "Needs Attention" | "Unsafe";

export type HealthFactor = { key: string; label: string; points: number; max: number; note?: string };

export type HealthResult = {
  score: number; // 0-100
  status: HealthStatus;
  /** false → download stays blocked (same gate as evaluateDesign errors). */
  safe: boolean;
  factors: HealthFactor[];
  guidance: string[];
  disclaimer: string;
};

export const HEALTH_DISCLAIMER =
  "The Health Score is a readability heuristic, not a guarantee that every scanner will succeed.";

function worstContrast(design: QRDesignOptions): number | null {
  const fg =
    design.gradientType === "none"
      ? [design.foregroundColor]
      : [design.gradientStartColor, design.gradientEndColor];
  if (!isValidHexColor(design.backgroundColor) || fg.some((c) => !isValidHexColor(c))) return null;
  return Math.min(...fg.map((c) => contrastRatio(c, design.backgroundColor)));
}

function statusFor(score: number, safe: boolean, hasWarnings: boolean): HealthStatus {
  if (!safe) return "Unsafe";
  // "Excellent" means nothing to improve — an active warning (e.g. low contrast)
  // caps it at "Good" even with a high score, so the label matches the advice.
  if (score >= 85 && !hasWarnings) return "Excellent";
  if (score >= 70) return "Good";
  return "Needs Attention";
}

/**
 * @param design    the current design
 * @param opts.payload  the string the QR encodes (for density)
 * @param opts.destinationValid  false when the destination URL is known-broken
 */
export function qrHealth(
  design: QRDesignOptions,
  opts: { payload?: string; destinationValid?: boolean } = {},
): HealthResult {
  const factors: HealthFactor[] = [];
  const guidance: string[] = [];
  const g = (msg: string) => { if (!guidance.includes(msg)) guidance.push(msg); };

  // 1. Contrast (30)
  const contrast = worstContrast(design);
  if (contrast === null) {
    factors.push({ key: "contrast", label: "Contrast", points: 0, max: 30, note: "Invalid color" });
    g("Use valid, high-contrast colors.");
  } else if (contrast >= CONTRAST_WARNING_THRESHOLD) {
    factors.push({ key: "contrast", label: "Contrast", points: 30, max: 30, note: `${contrast.toFixed(1)}:1` });
  } else if (contrast >= CONTRAST_ERROR_THRESHOLD) {
    factors.push({ key: "contrast", label: "Contrast", points: 18, max: 30, note: `${contrast.toFixed(1)}:1 — low` });
    g("Increase the contrast between the code and its background.");
  } else {
    factors.push({ key: "contrast", label: "Contrast", points: 0, max: 30, note: `${contrast.toFixed(1)}:1 — unsafe` });
    g("Increase the contrast between the code and its background.");
  }

  // 2. Quiet zone (15)
  if (design.margin >= RECOMMENDED_MARGIN) {
    factors.push({ key: "quiet", label: "Quiet zone", points: 15, max: 15 });
  } else if (design.margin >= MIN_MARGIN) {
    factors.push({ key: "quiet", label: "Quiet zone", points: 9, max: 15, note: "Small margin" });
    g("Increase the quiet-zone margin.");
  } else {
    factors.push({ key: "quiet", label: "Quiet zone", points: 0, max: 15, note: "Too small" });
    g("Increase the quiet-zone margin.");
  }

  // 3. Logo (15)
  if (!design.logoDataUrl) {
    factors.push({ key: "logo", label: "Logo", points: 15, max: 15, note: "None" });
  } else {
    const okSize = design.logoSize <= MAX_LOGO_SIZE;
    const okEc = design.errorCorrection === "H";
    if (okSize && okEc) {
      factors.push({ key: "logo", label: "Logo", points: 15, max: 15, note: `${design.logoSize}%` });
    } else {
      factors.push({ key: "logo", label: "Logo", points: 0, max: 15, note: !okSize ? "Too large" : "Needs EC H" });
      if (!okSize) g("Reduce the logo size.");
      if (!okEc) g("Use error correction H when a logo is included.");
    }
  }

  // 4. Error correction (10)
  const ecPoints = { H: 10, Q: 9, M: 7, L: 4 }[design.errorCorrection] ?? 7;
  factors.push({ key: "ec", label: "Error correction", points: ecPoints, max: 10, note: design.errorCorrection });
  if (design.errorCorrection === "L") g("Use a higher error-correction level (Q or H) for print.");

  // 5. Payload density (15)
  const len = opts.payload?.length ?? 0;
  const densityPoints = len === 0 ? 15 : len <= 300 ? 15 : len <= 800 ? 12 : len <= 1500 ? 8 : len <= 2500 ? 4 : 1;
  factors.push({ key: "density", label: "Payload density", points: densityPoints, max: 15, note: len ? `${len} chars` : "—" });
  if (len > 1500) g("Shorten the destination or use a hosted short link.");

  // 6. Destination (15)
  if (opts.destinationValid === false) {
    factors.push({ key: "destination", label: "Destination", points: 0, max: 15, note: "Broken" });
    g("Fix the destination URL.");
  } else {
    factors.push({ key: "destination", label: "Destination", points: 15, max: 15 });
  }

  let score = factors.reduce((s, f) => s + f.points, 0);

  // Light framing penalty (a tall frame squeezing a square export).
  if (design.frameId && design.frameId !== "none" && design.exportFit === "square") {
    // evaluateDesign already warns about this; nudge the score down a touch.
    const framed = evaluateDesign(design, { hasPayload: len > 0 }).issues.some((i) => i.code === "frame-tight");
    if (framed) {
      score = Math.max(0, score - 5);
      g("Give the QR more room — use “Fit frame” or a larger size.");
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const safe = evaluateDesign(design, { hasPayload: len > 0 }).isSafe && opts.destinationValid !== false;

  return {
    score,
    status: statusFor(score, safe, guidance.length > 0),
    safe,
    factors,
    guidance,
    disclaimer: HEALTH_DISCLAIMER,
  };
}
