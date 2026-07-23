import { defaultDesign } from "./defaults";
import { relativeLuminance } from "./readability";
import type { QRDesignOptions } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * PRE-MADE TEMPLATES — original QR Gate designs, not third-party art.
 *
 * A template is just a patch of the REAL design state, so selecting one
 * reconfigures the actual renderer (preview, PNG, SVG) — never a static
 * picture. It is applied ONCE on click; every later manual edit wins
 * (the design simply keeps `templateId` so the UI can show "Modified").
 *
 * Every template is dark-on-light: inverted codes are a common cause of
 * scan failures, so the library deliberately avoids them.
 * ───────────────────────────────────────────────────────────────
 */

export type QRTemplateCategory = "minimal" | "colorful" | "business" | "social" | "events" | "food";

export type QRTemplate = {
  id: string;
  name: string;
  category: QRTemplateCategory;
  /** Design fields this template sets. Content, logo, and frame text are never touched. */
  apply: Partial<QRDesignOptions>;
};

export const TEMPLATE_CATEGORIES: ReadonlyArray<{ id: QRTemplateCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "minimal", label: "Minimal" },
  { id: "colorful", label: "Colorful" },
  { id: "business", label: "Business" },
  { id: "social", label: "Social" },
  { id: "events", label: "Events" },
  { id: "food", label: "Food" },
];

/** White or ink text, whichever stays readable on `hex`. */
export function readableTextOn(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#1B1B2F" : "#FFFFFF";
}

const solid = (
  fg: string,
  bg: string,
  rest: Partial<QRDesignOptions> = {},
): Partial<QRDesignOptions> => ({ foregroundColor: fg, backgroundColor: bg, gradientType: "none", ...rest });

const grad = (
  start: string,
  end: string,
  bg: string,
  rest: Partial<QRDesignOptions> = {},
): Partial<QRDesignOptions> => ({
  gradientType: "linear",
  gradientStartColor: start,
  gradientEndColor: end,
  gradientRotation: 45,
  backgroundColor: bg,
  ...rest,
});

export const qrTemplates: QRTemplate[] = [
  /* ── Minimal ── */
  {
    id: "classic",
    name: "Classic Black",
    category: "minimal",
    apply: solid("#1B1B2F", "#FFFFFF", {
      dotStyle: "square",
      cornerSquareStyle: "square",
      cornerDotStyle: "square",
      margin: 4,
      errorCorrection: "Q",
    }),
  },
  {
    id: "soft",
    name: "Soft Rounded",
    category: "minimal",
    apply: solid("#1B1B2F", "#FFFFFF", {
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
    }),
  },
  {
    id: "minimal-blue",
    name: "Minimal Blue",
    category: "minimal",
    apply: solid("#3B5BFF", "#FFFFFF", {
      dotStyle: "dots",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
    }),
  },
  {
    id: "clean",
    name: "Clean Slate",
    category: "minimal",
    apply: solid("#0E2440", "#F7F5EF", {
      dotStyle: "classy",
      cornerSquareStyle: "square",
      cornerDotStyle: "square",
      margin: 5,
      errorCorrection: "Q",
    }),
  },

  /* ── Colorful ── */
  {
    id: "sunset",
    name: "Sunset",
    category: "colorful",
    apply: grad("#F59E0B", "#DC2626", "#FFF7ED", {
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
    }),
  },
  {
    id: "ocean",
    name: "Ocean",
    category: "colorful",
    apply: grad("#0EA5E9", "#1E3A8A", "#F0F9FF", {
      dotStyle: "extra-rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
    }),
  },
  {
    id: "lavender",
    name: "Lavender",
    category: "colorful",
    apply: grad("#8B5CF6", "#5B21B6", "#F5F3FF", {
      dotStyle: "classy-rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
    }),
  },
  {
    id: "mint",
    name: "Mint",
    category: "colorful",
    apply: grad("#10B981", "#0F766E", "#ECFDF5", {
      dotStyle: "dots",
      cornerSquareStyle: "rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
    }),
  },
  {
    id: "berry",
    name: "Berry",
    category: "colorful",
    apply: grad("#EC4899", "#9D174D", "#FDF2F8", {
      dotStyle: "rounded",
      cornerSquareStyle: "rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
    }),
  },

  /* ── Business ── */
  {
    id: "corporate",
    name: "Corporate",
    category: "business",
    apply: solid("#0F172A", "#FFFFFF", {
      dotStyle: "square",
      cornerSquareStyle: "square",
      cornerDotStyle: "square",
      margin: 4,
      errorCorrection: "Q",
      frameId: "border",
    }),
  },
  {
    id: "gold",
    name: "Premium Gold",
    category: "business",
    apply: grad("#C79A3A", "#7A5A16", "#FFFDF5", {
      dotStyle: "classy",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 6,
      errorCorrection: "Q",
      frameId: "label",
    }),
  },
  {
    id: "navy",
    name: "Professional Navy",
    category: "business",
    apply: solid("#0E2440", "#F2F5F9", {
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "square",
      margin: 5,
      errorCorrection: "Q",
      frameId: "header",
    }),
  },

  /* ── Social ── */
  {
    id: "creator",
    name: "Creator",
    category: "social",
    apply: grad("#F59E0B", "#DB2777", "#FFFBF5", {
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
      frameId: "follow",
    }),
  },
  {
    id: "story",
    name: "Story",
    category: "social",
    apply: grad("#FBBF24", "#C026D3", "#FFF7FB", {
      dotStyle: "extra-rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
      frameId: "badge",
    }),
  },
  {
    id: "linkhub",
    name: "Link Hub",
    category: "social",
    apply: solid("#111827", "#FFFFFF", {
      dotStyle: "dots",
      cornerSquareStyle: "rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
      frameId: "pill",
    }),
  },

  /* ── Events ── */
  {
    id: "wedding",
    name: "Wedding",
    category: "events",
    apply: solid("#8A6A4F", "#FFFDF9", {
      dotStyle: "classy-rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 6,
      errorCorrection: "Q",
      frameId: "poster",
    }),
  },
  {
    id: "birthday",
    name: "Birthday",
    category: "events",
    apply: grad("#F472B6", "#7C3AED", "#FFFBFE", {
      dotStyle: "dots",
      cornerSquareStyle: "rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
      frameId: "badge",
    }),
  },
  {
    id: "party",
    name: "Party",
    category: "events",
    apply: grad("#7C3AED", "#DB2777", "#FBF5FF", {
      dotStyle: "extra-rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
      frameId: "ticket",
    }),
  },

  /* ── Food ── */
  {
    id: "restaurant",
    name: "Restaurant",
    category: "food",
    apply: solid("#7C2D12", "#FFF7ED", {
      dotStyle: "rounded",
      cornerSquareStyle: "rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
      frameId: "header",
    }),
  },
  {
    id: "cafe",
    name: "Café",
    category: "food",
    apply: solid("#3F2D23", "#FAF3E8", {
      dotStyle: "classy",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      margin: 5,
      errorCorrection: "Q",
      frameId: "label",
    }),
  },
];

const byId = new Map(qrTemplates.map((t) => [t.id, t]));

export function getTemplate(id: string | null | undefined): QRTemplate | null {
  return (id && byId.get(id)) || null;
}

/**
 * The patch to apply when a template is selected. Frame colors follow
 * the new palette unless the template pinned them, so a template + frame
 * combination always reads as one design.
 */
export function applyTemplate(design: QRDesignOptions, template: QRTemplate): Partial<QRDesignOptions> {
  const patch: Partial<QRDesignOptions> = { ...template.apply, templateId: template.id };
  const background = patch.backgroundColor ?? design.backgroundColor;
  const usesGradient = (patch.gradientType ?? design.gradientType) !== "none";
  const accent = usesGradient
    ? (patch.gradientStartColor ?? design.gradientStartColor)
    : (patch.foregroundColor ?? design.foregroundColor);

  if (patch.frameBackground === undefined) patch.frameBackground = background;
  if (patch.frameForeground === undefined) patch.frameForeground = accent;
  if (patch.frameTextColor === undefined) patch.frameTextColor = readableTextOn(accent);
  return patch;
}

/** Small, self-contained design used to render a template's mini QR thumbnail. */
export function templateThumbnailDesign(template: QRTemplate): QRDesignOptions {
  return {
    ...defaultDesign,
    ...template.apply,
    // Thumbnails show the QR style only — never a frame or logo.
    frameId: "none",
    logoDataUrl: null,
    margin: 2,
  };
}

/** Has the user edited the design since the template was applied? */
export function isTemplateModified(design: QRDesignOptions): boolean {
  const template = getTemplate(design.templateId);
  if (!template) return false;
  return !Object.entries(template.apply).every(
    ([key, value]) => design[key as keyof QRDesignOptions] === value,
  );
}
