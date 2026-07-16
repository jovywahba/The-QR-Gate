import { buildQRExportOptions, type PNGExportSize, type QRExportFormat } from "./styling";
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

  // Dynamic import keeps qr-code-styling (browser-only) out of any server bundle.
  const { default: QRCodeStyling } = await import("qr-code-styling");
  const qr = new QRCodeStyling(buildQRExportOptions(payload, design, size, format));

  const raw = await qr.getRawData(format);
  if (!raw) return false;
  const blob = raw instanceof Blob ? raw : new Blob([new Uint8Array(raw as Buffer)]);

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
