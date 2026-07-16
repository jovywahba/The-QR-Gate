import type { Gradient, Options } from "qr-code-styling";
import type { QRDesignOptions } from "./types";

/**
 * THE single renderer configuration. Every QR surface — live editor
 * preview, preset thumbnails, sticky panel, Step-4 preview, and the
 * PNG export — goes through this one mapping, so what you see is
 * exactly what downloads.
 */

/** design.margin is a % of the QR size (proportional at any export size). */
export function marginPx(margin: number, size: number): number {
  return Math.round((margin * size) / 100);
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function dotColorOrGradient(design: QRDesignOptions): { color?: string; gradient?: Gradient } {
  if (design.gradientType === "none") return { color: design.foregroundColor };
  return {
    gradient: {
      type: design.gradientType,
      rotation: design.gradientType === "linear" ? degreesToRadians(design.gradientRotation) : 0,
      colorStops: [
        { offset: 0, color: design.gradientStartColor },
        { offset: 1, color: design.gradientEndColor },
      ],
    },
  };
}

export function buildQRStylingOptions(
  payload: string,
  design: QRDesignOptions,
  size: number,
): Options {
  const paint = dotColorOrGradient(design);
  // Corner pieces follow the dot paint (solid or gradient) so the code
  // reads as one mark, exactly like the exported file.
  return {
    type: "canvas",
    width: size,
    height: size,
    data: payload,
    margin: marginPx(design.margin, size),
    qrOptions: { errorCorrectionLevel: design.errorCorrection },
    dotsOptions: { ...paint, type: design.dotStyle },
    cornersSquareOptions: { ...paint, type: design.cornerSquareStyle },
    cornersDotOptions: { ...paint, type: design.cornerDotStyle },
    backgroundOptions: { color: design.backgroundColor },
    ...(design.logoDataUrl
      ? {
          image: design.logoDataUrl,
          imageOptions: {
            imageSize: design.logoSize / 100,
            margin: Math.round((design.logoMargin * size) / 320),
            hideBackgroundDots: design.logoBackground,
            crossOrigin: "anonymous",
          },
        }
      : { image: undefined }),
  };
}

/** @deprecated Part-1 name — kept so nothing silently forks the pipeline. */
export const toQRCodeStylingOptions = buildQRStylingOptions;

export type QRExportFormat = "png" | "svg";

/** PNG export resolutions offered in Step 4 (px). */
export const PNG_EXPORT_SIZES = [512, 1024, 2048] as const;
export type PNGExportSize = (typeof PNG_EXPORT_SIZES)[number];

/**
 * Export variant of the same options: identical design mapping, only
 * the draw target changes (canvas raster vs real vector SVG).
 */
export function buildQRExportOptions(
  payload: string,
  design: QRDesignOptions,
  size: number,
  format: QRExportFormat,
): Options {
  return { ...buildQRStylingOptions(payload, design, size), type: format === "svg" ? "svg" : "canvas" };
}
