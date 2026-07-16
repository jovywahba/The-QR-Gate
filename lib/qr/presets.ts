import { defaultDesign } from "./defaults";
import type { QRDesignOptions } from "./types";

/**
 * Design presets — each is a real partial design applied over the
 * current state (content and logo are never touched). Every preset
 * stays contrast-safe; the "Halfstack" preset uses the brand blue
 * only as a gradient endpoint against white, which decodes cleanly
 * (verified by the decode QA).
 */

export type QRDesignPreset = {
  id: string;
  name: string;
  apply: Partial<QRDesignOptions>;
};

export const DESIGN_PRESETS: readonly QRDesignPreset[] = [
  {
    id: "classic",
    name: "Classic",
    apply: {
      dotStyle: "square",
      cornerSquareStyle: "square",
      cornerDotStyle: "square",
      foregroundColor: "#1B1B2F",
      backgroundColor: "#FFFFFF",
      gradientType: "none",
    },
  },
  {
    id: "rounded",
    name: "Rounded",
    apply: {
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "rounded",
      foregroundColor: "#1B1B2F",
      backgroundColor: "#FFFFFF",
      gradientType: "none",
    },
  },
  {
    id: "dots",
    name: "Dots",
    apply: {
      dotStyle: "dots",
      cornerSquareStyle: "dot",
      cornerDotStyle: "dot",
      foregroundColor: "#1B1B2F",
      backgroundColor: "#FFFFFF",
      gradientType: "none",
    },
  },
  {
    id: "bold",
    name: "Bold",
    apply: {
      dotStyle: "extra-rounded",
      cornerSquareStyle: "square",
      cornerDotStyle: "square",
      foregroundColor: "#000000",
      backgroundColor: "#FFFFFF",
      gradientType: "none",
    },
  },
  {
    id: "soft",
    name: "Soft",
    apply: {
      dotStyle: "classy-rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "rounded",
      foregroundColor: "#2A2A3C",
      backgroundColor: "#FAFAF8",
      gradientType: "none",
    },
  },
  {
    id: "halfstack",
    name: "Halfstack",
    apply: {
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "rounded",
      foregroundColor: "#1B1B2F",
      backgroundColor: "#FFFFFF",
      gradientType: "linear",
      gradientStartColor: "#1B1B2F",
      gradientEndColor: "#3B5BFF",
      gradientRotation: 45,
    },
  },
];

/** Apply a preset over the current design — logo + margin + EC untouched. */
export function applyPreset(current: QRDesignOptions, preset: QRDesignPreset): QRDesignOptions {
  return { ...current, ...preset.apply };
}

/** The design a preset thumbnail renders (default base so tiles look stable). */
export function presetThumbnailDesign(preset: QRDesignPreset): QRDesignOptions {
  return { ...defaultDesign, logoDataUrl: null, ...preset.apply };
}
