import { composeArtworkCanvas, composeArtworkSvg } from "./composition";
import { type PNGExportSize, type QRExportFormat } from "./styling";
import type { QRDesignOptions, QRType } from "./types";

/**
 * Real exports through the single pipeline — PNG rendered fresh at the
 * requested resolution (never a stretched preview) and SVG as true
 * vector output from the same renderer (never a PNG in an SVG wrapper).
 * Client-only: call from event handlers in client components.
 */

export const DEFAULT_EXPORT_SIZE: PNGExportSize = 1024;

/** the-qr-gate-{type}-{YYYY-MM-DD}.{png|svg} */
export function exportFileName(
  type: QRType,
  format: QRExportFormat = "png",
  date: Date = new Date(),
): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `the-qr-gate-${type}-${yyyy}-${mm}-${dd}.${format}`;
}

/** Renders `payload` with the shared options and triggers a download. */
export async function downloadQRCode(args: {
  payload: string;
  type: QRType;
  design: QRDesignOptions;
  format: QRExportFormat;
  /** Raster resolution for PNG; SVG uses it as the viewBox size (still vector). */
  size?: number;
}): Promise<boolean> {
  const { payload, type, design, format, size = DEFAULT_EXPORT_SIZE } = args;
  if (!payload) return false;

  // Both formats go through the ONE composition layer, so the exported
  // file matches the live preview exactly — frame included.
  let blob: Blob | null;
  if (format === "svg") {
    const svg = await composeArtworkSvg({ payload, design, size, type });
    blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  } else {
    const canvas = await composeArtworkCanvas({ payload, design, size, type });
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  }
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName(type, format);
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Give the click a tick before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
  return true;
}

/** @deprecated Part-1 wrapper — PNG only. */
export async function downloadQRCodePng(args: {
  payload: string;
  type: QRType;
  design: QRDesignOptions;
  size?: number;
}): Promise<boolean> {
  return downloadQRCode({ ...args, format: "png" });
}
