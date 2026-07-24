/**
 * ───────────────────────────────────────────────────────────────
 * Pure presentation helpers for QR status + scan tracking, shared by
 * the dashboard, the My QR Codes table, and the analytics pages so
 * they never describe a QR differently from one another.
 *
 * These are deliberately dependency-free (no React, no Supabase) and
 * unit-tested — the honesty rules here ("don't say 0 scans when a QR
 * can't be tracked at all") matter and shouldn't drift per-view.
 * ───────────────────────────────────────────────────────────────
 */

/** How a QR is encoded/tracked (mirrors public.qr_codes.tracking_mode). */
export type TrackingMode = "hosted" | "redirect" | "direct" | "native" | (string & {});

/** hosted + redirect route through our server, so their scans are counted. */
export function isTrackable(mode: TrackingMode): boolean {
  return mode === "hosted" || mode === "redirect";
}

export type ScanDisplay =
  /** Trackable and has real scans. */
  | { kind: "count"; label: string; scans: number }
  /** Trackable, but nobody has scanned it yet — NOT the same as "0 tracked". */
  | { kind: "none"; label: string; scans: 0 }
  /** A direct-URL QR the user chose not to track. */
  | { kind: "disabled"; label: string }
  /** A WiFi / vCard payload — scanning never calls our server, so it's untrackable. */
  | { kind: "native"; label: string };

/**
 * The one honest way to describe a QR's scan count. Native and
 * tracking-off codes are called out explicitly instead of being shown
 * a misleading "0 scans".
 */
export function scanDisplay(mode: TrackingMode, scans: number | null | undefined): ScanDisplay {
  if (mode === "native") return { kind: "native", label: "Native QR — not trackable" };
  if (mode === "direct") return { kind: "disabled", label: "Tracking disabled" };
  const n = Math.max(0, Math.floor(scans ?? 0));
  if (n === 0) return { kind: "none", label: "No scans yet", scans: 0 };
  return { kind: "count", label: `${n.toLocaleString()} ${n === 1 ? "scan" : "scans"}`, scans: n };
}

export type StatusTone = "published" | "draft" | "archived";
export type StatusBadge = { label: string; tone: StatusTone };

/**
 * Published / Draft / Archived — the three states the schema actually
 * distinguishes. (We deliberately don't synthesize an "unpublished
 * changes" badge: edits live client-side until the user re-commits, so
 * a published row is always in sync with its last publish — there's no
 * reliable DB signal for pending changes to show.)
 */
export function statusBadge(status: string): StatusBadge {
  switch (status) {
    case "published":
      return { label: "Published", tone: "published" };
    case "archived":
      return { label: "Archived", tone: "archived" };
    default:
      return { label: "Draft", tone: "draft" };
  }
}

/** A short, human tracking descriptor for tooltips / the create toggle. */
export function trackingDescription(mode: TrackingMode): string {
  switch (mode) {
    case "hosted":
    case "redirect":
      return "Tracked through The QR Gate";
    case "native":
      return "Native QR — analytics unavailable";
    default:
      return "Direct destination — no analytics";
  }
}
