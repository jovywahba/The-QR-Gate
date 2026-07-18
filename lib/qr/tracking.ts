import { requiresPublishing } from "./payloads";
import type { QRContent, QRType } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Tracking model — how a committed QR is encoded and whether its
 * scans can be counted. Pure + unit-tested.
 *
 *  hosted   : QR encodes {app}/q/{slug}  → tracked at /q/[slug]
 *  redirect : QR encodes {app}/r/{slug}  → 302 to the URL, tracked
 *  direct   : QR encodes the external URL itself → NOT tracked
 *  native   : QR encodes a WIFI:/vCard payload → NOT trackable
 *
 * Native (WiFi/vCard) scans genuinely cannot be counted: scanning
 * them never hits our server. We say so honestly rather than fake it.
 * ───────────────────────────────────────────────────────────────
 */

export type TrackingMode = "hosted" | "redirect" | "direct" | "native";
export type TrackingCapability = "hosted" | "optional" | "none";

const NATIVE_TYPES = new Set<QRType>(["wifi", "vcard"]);

/** What tracking is possible for this content in its current mode. */
export function trackingCapability(content: QRContent): TrackingCapability {
  if (requiresPublishing(content)) return "hosted"; // has a /q/[slug] page
  if (NATIVE_TYPES.has(content.type)) return "none"; // wifi/vcard payload
  return "optional"; // direct URL type — can opt into a /r/[slug] short link
}

/** The concrete mode given the content and the user's tracking choice. */
export function resolveTrackingMode(content: QRContent, trackingEnabled: boolean): TrackingMode {
  const cap = trackingCapability(content);
  if (cap === "hosted") return "hosted";
  if (cap === "none") return "native";
  return trackingEnabled ? "redirect" : "direct";
}

/** Does this mode encode one of OUR URLs (so it needs a committed slug)? */
export function encodesServerUrl(mode: TrackingMode): boolean {
  return mode === "hosted" || mode === "redirect";
}

/** Are scans countable in this mode? */
export function isTrackable(mode: TrackingMode): boolean {
  return mode === "hosted" || mode === "redirect";
}

/** Can the user toggle tracking on/off for this content? */
export function canToggleTracking(content: QRContent): boolean {
  return trackingCapability(content) === "optional";
}
