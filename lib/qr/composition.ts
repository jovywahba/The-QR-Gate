import {
  getFrame,
  resolveFrameText,
  type FrameColors,
  type FrameLayout,
  type FramePrimitive,
  type QRFrame,
} from "./frames";
import { buildQRExportOptions } from "./styling";
import type { QRDesignOptions, QRType } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * THE composition layer. A frame + the REAL QR are combined here into
 * one artwork, and the SAME geometry drives every surface:
 *
 *   computeArtwork()      → geometry + primitives (pure, testable)
 *   composeArtworkCanvas() → live preview AND PNG export
 *   composeArtworkSvg()    → true vector SVG (QR nested as vector,
 *                            frame as real shapes, CTA as <text>)
 *
 * There is exactly one layout implementation, so preview == PNG == SVG.
 * Primitives are only ever drawn outside the QR rect, so the quiet zone
 * (rendered inside the QR itself) is never covered.
 * ───────────────────────────────────────────────────────────────
 */

/** Font stack used for CTA text in canvas and SVG alike. */
export const FRAME_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Rough advance width per character for bold sans — keeps canvas + SVG identical. */
const AVG_CHAR = 0.6;

export type ArtworkSpec = {
  payload: string;
  design: QRDesignOptions;
  /** Requested export size in px (the square size, or the QR size in "frame" fit). */
  size: number;
  /** Used only to resolve the default CTA text when the user typed none. */
  type?: QRType | null;
};

export type Artwork = {
  frame: QRFrame;
  layout: FrameLayout;
  /** Final canvas dimensions. */
  width: number;
  height: number;
  /** Where the frame layout is placed inside the canvas (letterboxing in square fit). */
  dx: number;
  dy: number;
  /** Canvas background. */
  surface: string;
};

/** Frame palette taken from the design (with sensible fallbacks). */
export function frameColorsFor(design: QRDesignOptions): FrameColors {
  return {
    background: design.frameBackground || design.backgroundColor,
    foreground:
      design.frameForeground ||
      (design.gradientType === "none" ? design.foregroundColor : design.gradientStartColor),
    text: design.frameTextColor || "#FFFFFF",
  };
}

/** Shrink a CTA font size so the text fits the artwork width (deterministic). */
function fitTextSize(text: string, size: number, tracking: number, maxWidth: number): number {
  if (!text) return size;
  const width = text.length * size * AVG_CHAR + Math.max(0, text.length - 1) * tracking;
  if (width <= maxWidth || width === 0) return size;
  return Math.max(6, Math.floor(size * (maxWidth / width)));
}

function fitPrimitives(primitives: FramePrimitive[], maxWidth: number): FramePrimitive[] {
  return primitives.map((p) => {
    if (p.kind !== "text") return p;
    const tracking = p.tracking ?? 0;
    const size = fitTextSize(p.text, p.size, tracking, maxWidth);
    return size === p.size ? p : { ...p, size, tracking: tracking * (size / p.size) };
  });
}

/**
 * Resolve the whole artwork geometry.
 *  - "square": the framed artwork is scaled to fit `size` × `size`.
 *  - "frame":  the QR keeps `size` and the canvas grows to fit the frame.
 */
export function computeArtwork(spec: Omit<ArtworkSpec, "payload">): Artwork {
  const { design, size, type } = spec;
  const frame = getFrame(design.frameId);
  const colors = frameColorsFor(design);
  const text = resolveFrameText(frame, design.frameText, type);

  // Probe the frame at a reference size to learn its aspect ratio.
  const BASE = 1000;
  const probe = frame.layout({ qrSize: BASE, text, colors });
  const longest = Math.max(probe.width, probe.height);

  const fitFrame = design.exportFit === "frame";
  const qrSize = fitFrame ? size : Math.max(16, Math.floor((size * BASE) / longest));
  const layout = frame.layout({ qrSize, text, colors });

  const width = fitFrame ? layout.width : size;
  const height = fitFrame ? layout.height : size;
  const dx = Math.round((width - layout.width) / 2);
  const dy = Math.round((height - layout.height) / 2);

  const fitted: FrameLayout = {
    ...layout,
    back: fitPrimitives(layout.back, layout.width * 0.9),
    front: fitPrimitives(layout.front, layout.width * 0.9),
  };

  return {
    frame,
    layout: fitted,
    width,
    height,
    dx,
    dy,
    // With no frame the QR paints its own background; framed artwork uses
    // the frame surface so letterboxing never shows a mismatched band.
    surface: frame.id === "none" ? design.backgroundColor : colors.background,
  };
}

/** Final exported pixel dimensions — used by the UI to tell the user. */
export function artworkDimensions(
  design: QRDesignOptions,
  size: number,
  type?: QRType | null,
): { width: number; height: number } {
  const { width, height } = computeArtwork({ design, size, type });
  return { width, height };
}

/* ══════════════════ Canvas (live preview + PNG) ══════════════════ */

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
) {
  const r = Math.max(0, Math.min(rx, w / 2, h / 2));
  ctx.beginPath();
  if (r === 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPrimitives(
  ctx: CanvasRenderingContext2D,
  primitives: FramePrimitive[],
  dx: number,
  dy: number,
) {
  for (const p of primitives) {
    if (p.kind === "rect") {
      roundRectPath(ctx, p.x + dx, p.y + dy, p.w, p.h, p.rx ?? 0);
      if (p.fill) {
        ctx.fillStyle = p.fill;
        ctx.fill();
      }
      if (p.stroke) {
        ctx.strokeStyle = p.stroke;
        ctx.lineWidth = p.strokeWidth ?? 1;
        ctx.stroke();
      }
    } else if (p.kind === "line") {
      ctx.beginPath();
      ctx.moveTo(p.x1 + dx, p.y1 + dy);
      ctx.lineTo(p.x2 + dx, p.y2 + dy);
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = p.strokeWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    } else if (p.kind === "circle") {
      ctx.beginPath();
      ctx.arc(p.cx + dx, p.cy + dy, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.fill;
      ctx.fill();
    } else {
      ctx.fillStyle = p.fill;
      ctx.font = `${p.weight} ${p.size}px ${FRAME_FONT}`;
      ctx.textAlign = p.anchor === "middle" ? "center" : p.anchor === "end" ? "right" : "left";
      ctx.textBaseline = "middle";
      // letterSpacing is progressive-enhancement; ignored where unsupported.
      try {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${p.tracking ?? 0}px`;
      } catch {
        /* older browsers */
      }
      ctx.fillText(p.text, p.x + dx, p.y + dy);
      try {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
      } catch {
        /* noop */
      }
    }
  }
}

async function qrRasterImage(
  payload: string,
  design: QRDesignOptions,
  size: number,
): Promise<{ img: HTMLImageElement; revoke: () => void }> {
  const { default: QRCodeStyling } = await import("qr-code-styling");
  const qr = new QRCodeStyling(buildQRExportOptions(payload, design, size, "png"));
  const raw = await qr.getRawData("png");
  if (!raw) throw new Error("QR render failed");
  const blob = raw instanceof Blob ? raw : new Blob([new Uint8Array(raw as Buffer)]);
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("QR image decode failed"));
    img.src = url;
  });
  return { img, revoke: () => URL.revokeObjectURL(url) };
}

/** The composed artwork as a canvas — used by BOTH the preview and PNG export. */
export async function composeArtworkCanvas(spec: ArtworkSpec): Promise<HTMLCanvasElement> {
  const art = computeArtwork(spec);
  const canvas = document.createElement("canvas");
  canvas.width = art.width;
  canvas.height = art.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");

  ctx.fillStyle = art.surface;
  ctx.fillRect(0, 0, art.width, art.height);

  drawPrimitives(ctx, art.layout.back, art.dx, art.dy);

  const { img, revoke } = await qrRasterImage(spec.payload, spec.design, art.layout.qr.size);
  ctx.drawImage(
    img,
    art.layout.qr.x + art.dx,
    art.layout.qr.y + art.dy,
    art.layout.qr.size,
    art.layout.qr.size,
  );
  revoke();

  drawPrimitives(ctx, art.layout.front, art.dx, art.dy);
  return canvas;
}

/* ══════════════════ SVG (true vector export) ══════════════════ */

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function primitiveToSvg(p: FramePrimitive, dx: number, dy: number): string {
  if (p.kind === "rect") {
    const rx = p.rx ? ` rx="${p.rx}"` : "";
    const fill = p.fill ? ` fill="${p.fill}"` : ` fill="none"`;
    const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.strokeWidth ?? 1}"` : "";
    return `<rect x="${p.x + dx}" y="${p.y + dy}" width="${p.w}" height="${p.h}"${rx}${fill}${stroke}/>`;
  }
  if (p.kind === "line") {
    return `<line x1="${p.x1 + dx}" y1="${p.y1 + dy}" x2="${p.x2 + dx}" y2="${p.y2 + dy}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linecap="round"/>`;
  }
  if (p.kind === "circle") {
    return `<circle cx="${p.cx + dx}" cy="${p.cy + dy}" r="${p.r}" fill="${p.fill}"/>`;
  }
  const anchor = p.anchor === "middle" ? "middle" : p.anchor === "end" ? "end" : "start";
  const tracking = p.tracking ? ` letter-spacing="${p.tracking}"` : "";
  return `<text x="${p.x + dx}" y="${p.y + dy}" fill="${p.fill}" font-family="${esc(FRAME_FONT)}" font-size="${p.size}" font-weight="${p.weight}" text-anchor="${anchor}" dominant-baseline="central"${tracking}>${esc(p.text)}</text>`;
}

/** The QR as a real vector <svg>, positioned for nesting. */
async function qrVectorSvg(
  payload: string,
  design: QRDesignOptions,
  size: number,
  x: number,
  y: number,
): Promise<string> {
  const { default: QRCodeStyling } = await import("qr-code-styling");
  const qr = new QRCodeStyling(buildQRExportOptions(payload, design, size, "svg"));
  const raw = await qr.getRawData("svg");
  if (!raw) throw new Error("QR SVG render failed");
  const text = raw instanceof Blob ? await raw.text() : new TextDecoder().decode(raw as Uint8Array);

  // Keep only the <svg> element and give it a position for nesting.
  const start = text.indexOf("<svg");
  const inner = start >= 0 ? text.slice(start) : text;
  return inner.replace(/^<svg\b/, `<svg x="${x}" y="${y}"`);
}

/**
 * A tiny SVG preview of a frame for the picker tiles. Deliberately
 * lightweight — it draws the frame's real primitives around a stylised
 * QR block instead of rasterising a full code for every tile.
 */
export function frameThumbnailSvg(args: {
  frameId: string;
  colors: FrameColors;
  text: string;
  size?: number;
  qrColor?: string;
}): string {
  const { frameId, colors, text, size = 96, qrColor = "#1B1B2F" } = args;
  const frame = getFrame(frameId);
  const BASE = 1000;
  const probe = frame.layout({ qrSize: BASE, text, colors });
  const qrSize = Math.max(8, Math.floor((size * BASE) / Math.max(probe.width, probe.height)));
  const layout = frame.layout({ qrSize, text, colors });
  const dx = Math.round((size - layout.width) / 2);
  const dy = Math.round((size - layout.height) / 2);

  const fitted: FramePrimitive[][] = [
    fitPrimitives(layout.back, layout.width * 0.9),
    fitPrimitives(layout.front, layout.width * 0.9),
  ];
  const { x, y, size: q } = layout.qr;
  const unit = q / 7;
  const eye = (ex: number, ey: number) =>
    `<rect x="${ex}" y="${ey}" width="${unit * 2}" height="${unit * 2}" fill="${colors.background}"/>` +
    `<rect x="${ex + unit * 0.6}" y="${ey + unit * 0.6}" width="${unit * 0.8}" height="${unit * 0.8}" fill="${qrColor}"/>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" fill="${frame.id === "none" ? "#FFFFFF" : colors.background}"/>`,
    fitted[0].map((p) => primitiveToSvg(p, dx, dy)).join(""),
    `<rect x="${x + dx}" y="${y + dy}" width="${q}" height="${q}" fill="${qrColor}"/>`,
    eye(x + dx + unit * 0.5, y + dy + unit * 0.5),
    eye(x + dx + q - unit * 2.5, y + dy + unit * 0.5),
    eye(x + dx + unit * 0.5, y + dy + q - unit * 2.5),
    fitted[1].map((p) => primitiveToSvg(p, dx, dy)).join(""),
    `</svg>`,
  ].join("");
}

/** The composed artwork as REAL vector SVG (never a raster wrapped in SVG). */
export async function composeArtworkSvg(spec: ArtworkSpec): Promise<string> {
  const art = computeArtwork(spec);
  const back = art.layout.back.map((p) => primitiveToSvg(p, art.dx, art.dy)).join("");
  const front = art.layout.front.map((p) => primitiveToSvg(p, art.dx, art.dy)).join("");
  const qr = await qrVectorSvg(
    spec.payload,
    spec.design,
    art.layout.qr.size,
    art.layout.qr.x + art.dx,
    art.layout.qr.y + art.dy,
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${art.width}" height="${art.height}" viewBox="0 0 ${art.width} ${art.height}">`,
    `<rect width="${art.width}" height="${art.height}" fill="${art.surface}"/>`,
    back,
    qr,
    front,
    `</svg>`,
  ].join("");
}
