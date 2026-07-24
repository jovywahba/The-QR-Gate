/**
 * ───────────────────────────────────────────────────────────────
 * QR scheduling state (pure, unit-tested). The authority is SERVER
 * time (the caller passes `nowMs`) — never the visitor's browser clock.
 *
 * A hosted/tracked QR can carry a start and/or end instant. Before the
 * start it's "scheduled" (not yet available); at/after the end it's
 * "expired". Native (WiFi/vCard) codes can't be scheduled after download
 * because scanning them never reaches our server — the UI says so.
 * ───────────────────────────────────────────────────────────────
 */

export type ScheduleState = "none" | "scheduled" | "active" | "expired";

function ms(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

export function scheduleState(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  nowMs: number,
): ScheduleState {
  const start = ms(startsAt);
  const end = ms(endsAt);
  if (start === null && end === null) return "none";
  if (start !== null && nowMs < start) return "scheduled";
  if (end !== null && nowMs >= end) return "expired";
  return "active";
}

/** True when the QR should currently resolve to its real destination. */
export function isScheduleOpen(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  nowMs: number,
): boolean {
  const s = scheduleState(startsAt, endsAt, nowMs);
  return s === "none" || s === "active";
}
