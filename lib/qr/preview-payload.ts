import { getAppUrl } from "./public-url";

/**
 * ───────────────────────────────────────────────────────────────
 * The safe internal DESIGN-PREVIEW payload.
 *
 * Hosted + tracked-redirect QR types don't have their real
 * {app}/q/{slug} (or /r/{slug}) URL until the user publishes. To keep
 * the Step-3 design editor usable, the QR preview renders THIS payload —
 * a real, decodable URL that The QR Gate owns — so every design control
 * (dots, corners, gradient, logo, frame, frame text, quiet zone, colors,
 * error correction) is shown on a genuine QR, at a module density close
 * to the final /q/{slug} code.
 *
 * Invariants (see the screenshot bug / spec Part 1):
 *   • Owned by The QR Gate (its own domain) — never a third party.
 *   • NEVER localhost, even in local dev (production-domain fallback).
 *   • NEVER a guessed or fake /q/{slug} — a DISTINCT, honest
 *     /design-preview path that resolves to a real page explaining what
 *     it is, so it can't be mistaken for a final hosted code.
 *   • Render-only: it is NEVER downloadable and is swapped for the real
 *     published URL the instant publishing succeeds.
 * ───────────────────────────────────────────────────────────────
 */

/** Public domain used whenever the configured origin is localhost/unset. */
export const PROD_ORIGIN = "https://www.theqrgate.com";

/** The path the design-preview QR points at (a real, honest landing page). */
export const DESIGN_PREVIEW_PATH = "/design-preview";

/**
 * The origin the preview payload lives on — the same app origin the real
 * /q/{slug} uses, but never localhost (we don't encode a dev host into a
 * QR the user is styling for print).
 */
export function previewOrigin(): string {
  try {
    const url = new URL(getAppUrl());
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return PROD_ORIGIN;
    return url.origin;
  } catch {
    return PROD_ORIGIN;
  }
}

/**
 * The design-preview payload: a real, owned, decodable URL. Distinct from
 * any /q/{slug} so it can never be mistaken for — or distributed as — a
 * final hosted code.
 */
export function designPreviewPayload(): string {
  return `${previewOrigin()}${DESIGN_PREVIEW_PATH}`;
}

/** Is this string our design-preview payload (not a real destination)? */
export function isDesignPreviewPayload(payload: string): boolean {
  try {
    const url = new URL(payload);
    return url.pathname === DESIGN_PREVIEW_PATH;
  } catch {
    return false;
  }
}

/** What the QR preview is currently showing. */
export type QRPreviewMode = "live" | "design-preview" | "empty";

/**
 * Which payload the QR PREVIEW should render, and what it represents.
 *  - a real payload (direct/native types, or a published hosted URL) → "live"
 *  - a hosted/tracked type before publish → the safe design-preview payload
 *  - nothing valid to encode yet → "empty"
 *
 * The DOWNLOAD path never calls this — it requires the real committed
 * payload, so hosted downloads stay blocked until publish.
 */
export function resolvePreviewPayload(args: {
  /** The real payload to encode ("" when none, incl. hosted-before-publish). */
  generatedPayload: string;
  /** Is a QR type currently selected? */
  hasType: boolean;
  /** Does the type encode one of OUR URLs (hosted or tracked redirect)? */
  needsPublishing: boolean;
}): { payload: string; mode: QRPreviewMode } {
  if (args.generatedPayload) return { payload: args.generatedPayload, mode: "live" };
  if (args.hasType && args.needsPublishing) {
    return { payload: designPreviewPayload(), mode: "design-preview" };
  }
  return { payload: "", mode: "empty" };
}
