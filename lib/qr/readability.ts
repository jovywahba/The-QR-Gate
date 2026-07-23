import { getFrame, resolveFrameText } from "./frames";
import type { QRDesignOptions } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Readability heuristics for QR designs. This is a CHECK, not a
 * guarantee: luminance contrast is a strong predictor of scanner
 * success but only an independent decode proves a code works —
 * which is why the QA flow decodes real renders too.
 *
 * errors block Continue + download; warnings inform but allow.
 * ───────────────────────────────────────────────────────────────
 */

export type QRReadabilityIssue = {
  level: "warning" | "error";
  code: string;
  message: string;
};

export type QRReadabilityResult = {
  isSafe: boolean;
  issues: QRReadabilityIssue[];
};

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR.test(value.trim());
}

/** "#abc" → "#aabbcc"; passthrough for 6-digit; null when invalid. */
export function normalizeHexColor(value: string): string | null {
  const raw = value.trim();
  if (!HEX_COLOR.test(raw)) return null;
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toUpperCase();
  }
  return raw.toUpperCase();
}

/** WCAG-style relative luminance (used as a heuristic, not a QR standard). */
export function relativeLuminance(hex: string): number {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return 0;
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(normalized.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Contrast ratio 1–21 between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** Below this, scanners realistically start failing → error. */
export const CONTRAST_ERROR_THRESHOLD = 2;
/** Below this, print/lighting conditions get risky → warning. */
export const CONTRAST_WARNING_THRESHOLD = 4;

export const MIN_MARGIN = 2;
export const RECOMMENDED_MARGIN = 4;
export const MAX_MARGIN = 20;
export const MIN_LOGO_SIZE = 10;
export const MAX_LOGO_SIZE = 25;
/** Below this share of a square export, a framed QR gets uncomfortably small. */
export const FRAME_MIN_QR_SHARE = 0.6;

export function evaluateDesign(
  design: QRDesignOptions,
  options: { hasPayload?: boolean } = {},
): QRReadabilityResult {
  const issues: QRReadabilityIssue[] = [];
  const push = (level: "warning" | "error", code: string, message: string) =>
    issues.push({ level, code, message });

  /* ── Colors are valid, opaque hex ── */
  const fgColors =
    design.gradientType === "none"
      ? [design.foregroundColor]
      : [design.gradientStartColor, design.gradientEndColor];
  for (const color of fgColors) {
    if (!isValidHexColor(color)) {
      push("error", "invalid-foreground", "The foreground color isn't a valid hex value.");
    }
  }
  if (!isValidHexColor(design.backgroundColor)) {
    push("error", "invalid-background", "The background color isn't a valid hex value.");
  }
  if (issues.some((i) => i.level === "error")) return { isSafe: false, issues };

  /* ── Contrast: every foreground stop vs the background ── */
  const ratios = fgColors.map((color) => contrastRatio(color, design.backgroundColor));
  const worst = Math.min(...ratios);
  const identical = fgColors.some(
    (color) => normalizeHexColor(color) === normalizeHexColor(design.backgroundColor),
  );
  if (identical) {
    push("error", "same-color", "The foreground is the same as the background — the code is invisible.");
  } else if (worst < CONTRAST_ERROR_THRESHOLD) {
    push(
      "error",
      "contrast-too-low",
      design.gradientType === "none"
        ? "The foreground is too close to the background color."
        : "Part of the gradient is too close to the background color.",
    );
  } else if (worst < CONTRAST_WARNING_THRESHOLD) {
    push(
      "warning",
      "contrast-low",
      "Contrast is on the low side — the code may struggle in poor lighting or print.",
    );
  }

  /* ── Quiet zone ── */
  if (design.margin < MIN_MARGIN) {
    push("error", "margin-too-small", "A larger clear margin helps phones detect the QR code.");
  } else if (design.margin < RECOMMENDED_MARGIN) {
    push("warning", "margin-small", "A larger clear margin helps phones detect the QR code.");
  }

  /* ── Logo rules ── */
  if (design.logoDataUrl) {
    if (design.logoSize > MAX_LOGO_SIZE) {
      push("error", "logo-too-large", "The logo is too large and may make this QR code difficult to scan.");
    }
    if (design.errorCorrection !== "H") {
      push("error", "logo-needs-h", "Use error correction H when a logo is included.");
    }
  }

  /* ── Frame rules ──
     Frames never draw over the QR (composition only emits primitives
     outside the QR rect), so the quiet zone and finder patterns stay
     intact. What CAN hurt scanning is a tall frame squeezing the QR
     inside a fixed square export — so we check the share of the export
     the code actually gets. */
  if (design.frameId && design.frameId !== "none") {
    const frame = getFrame(design.frameId);
    const text = resolveFrameText(frame, design.frameText);
    const probe = frame.layout({
      qrSize: 1000,
      text,
      colors: { background: "#FFFFFF", foreground: "#000000", text: "#FFFFFF" },
    });
    const qrShare = 1000 / Math.max(probe.width, probe.height);

    if (design.exportFit === "square" && qrShare < FRAME_MIN_QR_SHARE) {
      push(
        "warning",
        "frame-tight",
        "This frame leaves little room for the QR in a square export — switch the export to “Fit frame” or pick a larger size.",
      );
    }
    if (frame.hasText) {
      if (!text) {
        push("warning", "frame-no-text", "This frame shows a call to action — add some frame text.");
      } else if (contrastRatio(design.frameTextColor, design.frameForeground) < 2.5) {
        push("warning", "frame-text-contrast", "The frame text is hard to read on the frame color.");
      }
    }
  }

  /* ── Payload ── */
  if (options.hasPayload === false) {
    push("warning", "no-payload", "Nothing to encode yet — complete the content (or publish) first.");
  }

  return { isSafe: !issues.some((i) => i.level === "error"), issues };
}
