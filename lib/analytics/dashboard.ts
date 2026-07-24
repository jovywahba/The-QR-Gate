import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ───────────────────────────────────────────────────────────────
 * Typed parsers + owner-scoped fetchers for the account dashboard.
 *
 * The parsers are pure (unit-tested); the fetchers wrap the
 * security-definer RPCs and DEGRADE GRACEFULLY when the dashboard SQL
 * (migration 0003) hasn't been applied yet — a missing RPC or field
 * never crashes the page, and a value that can't be verified is
 * reported as unknown (null), never as a fake 0.
 * ───────────────────────────────────────────────────────────────
 */

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

export type MostScanned = {
  id: string;
  name: string | null;
  type: string | null;
  scans: number;
  /** null when the schema predates unique tracking on this RPC. */
  unique: number | null;
  lastScanned: string | null;
};

export type ScanOverview = {
  totalScans: number;
  /** null when get_user_scan_overview() hasn't been upgraded yet (0003). */
  uniqueVisitors: number | null;
  scans30d: number;
  activeCount: number;
  mostScanned: MostScanned | null;
};

export const EMPTY_OVERVIEW: ScanOverview = {
  totalScans: 0,
  uniqueVisitors: null,
  scans30d: 0,
  activeCount: 0,
  mostScanned: null,
};

export function parseOverview(raw: unknown): ScanOverview {
  if (!raw || typeof raw !== "object") return EMPTY_OVERVIEW;
  const r = raw as Record<string, unknown>;
  const m = r.most_scanned as Record<string, unknown> | null | undefined;
  return {
    totalScans: num(r.total_scans),
    // Present-but-number vs absent (old function) → keep the distinction.
    uniqueVisitors: typeof r.unique_visitors === "number" ? r.unique_visitors : null,
    scans30d: num(r.scans_30d),
    activeCount: num(r.active_count),
    mostScanned:
      m && typeof m.id === "string"
        ? {
            id: m.id,
            name: str(m.name),
            type: str(m.type),
            scans: num(m.scans),
            unique: typeof m.unique === "number" ? m.unique : null,
            lastScanned: str(m.last_scanned),
          }
        : null,
  };
}

export type ActivityPoint = { date: string; count: number; unique: number };
export type ScanActivity = {
  /** false when get_user_scan_activity() isn't available yet. */
  available: boolean;
  total: number;
  unique: number;
  daily: ActivityPoint[];
};

export function parseActivity(raw: unknown): Omit<ScanActivity, "available"> {
  if (!raw || typeof raw !== "object") return { total: 0, unique: 0, daily: [] };
  const r = raw as Record<string, unknown>;
  const daily = Array.isArray(r.daily)
    ? (r.daily as Array<Record<string, unknown>>).map((d) => ({
        date: typeof d.date === "string" ? d.date : "",
        count: num(d.count),
        unique: num(d.unique),
      }))
    : [];
  return { total: num(r.total), unique: num(r.unique), daily };
}

export async function fetchScanOverview(supabase: SupabaseClient): Promise<ScanOverview> {
  try {
    const { data, error } = await supabase.rpc("get_user_scan_overview");
    if (error || data == null) return EMPTY_OVERVIEW;
    return parseOverview(data);
  } catch {
    return EMPTY_OVERVIEW;
  }
}

export async function fetchScanActivity(supabase: SupabaseClient, days: number): Promise<ScanActivity> {
  try {
    const { data, error } = await supabase.rpc("get_user_scan_activity", { p_days: days });
    // Any error (incl. "RPC not migrated yet") → treat the chart as unavailable
    // and let the page show an honest state instead of a fabricated graph.
    if (error) return { available: false, total: 0, unique: 0, daily: [] };
    if (data == null) return { available: true, total: 0, unique: 0, daily: [] };
    return { available: true, ...parseActivity(data) };
  } catch {
    return { available: false, total: 0, unique: 0, daily: [] };
  }
}
