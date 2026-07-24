import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Owner-of-the-platform data fetchers for the admin panel. Reads go
 * through admin-gated security-definer RPCs (get_admin_overview,
 * admin_list_users) so they stay efficient (no N+1) and fail closed if
 * the caller isn't an admin. Everything degrades gracefully to an honest
 * empty/unknown value if the admin migration (0004) isn't applied yet —
 * never a fabricated number.
 */

function n(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function nOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function s(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

export type AdminOverview = {
  available: boolean;
  totalUsers: number;
  newUsersToday: number;
  newUsersMonth: number;
  onlineNow: number;
  activeToday: number;
  totalQr: number;
  activeQr: number;
  pausedQr: number;
  totalScans: number;
  scansToday: number;
  scans30d: number;
  botScans30d: number;
  proAccounts: number;
  presenceByRoute: Record<string, number>;
};

const EMPTY_OVERVIEW: AdminOverview = {
  available: false,
  totalUsers: 0, newUsersToday: 0, newUsersMonth: 0, onlineNow: 0, activeToday: 0,
  totalQr: 0, activeQr: 0, pausedQr: 0, totalScans: 0, scansToday: 0, scans30d: 0,
  botScans30d: 0, proAccounts: 0, presenceByRoute: {},
};

export async function getAdminOverview(supabase: SupabaseClient): Promise<AdminOverview> {
  try {
    const { data, error } = await supabase.rpc("get_admin_overview");
    if (error || !data || typeof data !== "object") return EMPTY_OVERVIEW;
    const r = data as Record<string, unknown>;
    const route = (r.presence_by_route ?? {}) as Record<string, unknown>;
    const presence: Record<string, number> = {};
    for (const [k, v] of Object.entries(route)) presence[k] = n(v);
    return {
      available: true,
      totalUsers: n(r.total_users),
      newUsersToday: n(r.new_users_today),
      newUsersMonth: n(r.new_users_month),
      onlineNow: n(r.online_now),
      activeToday: n(r.active_today),
      totalQr: n(r.total_qr),
      activeQr: n(r.active_qr),
      pausedQr: n(r.paused_qr),
      totalScans: n(r.total_scans),
      scansToday: n(r.scans_today),
      scans30d: n(r.scans_30d),
      botScans30d: n(r.bot_scans_30d),
      proAccounts: n(r.pro_accounts),
      presenceByRoute: presence,
    };
  } catch {
    return EMPTY_OVERVIEW;
  }
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  suspended: boolean;
  online: boolean;
  lastSeenAt: string | null;
  isPro: boolean;
  qrTotal: number;
  qrActive: number;
};

export type AdminUserFilter = "all" | "online" | "free" | "pro" | "suspended" | "new" | "over_limit";

export async function listAdminUsers(
  supabase: SupabaseClient,
  opts: { search?: string; filter?: AdminUserFilter; limit?: number; offset?: number } = {},
): Promise<{ available: boolean; rows: AdminUserRow[] }> {
  try {
    const { data, error } = await supabase.rpc("admin_list_users", {
      p_search: opts.search?.trim() || null,
      p_filter: opts.filter ?? "all",
      p_limit: opts.limit ?? 50,
      p_offset: opts.offset ?? 0,
    });
    if (error || !Array.isArray(data)) return { available: false, rows: [] };
    const rows = (data as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      email: s(r.email),
      fullName: s(r.full_name),
      avatarUrl: s(r.avatar_url),
      createdAt: s(r.created_at),
      suspended: Boolean(r.suspended),
      online: Boolean(r.online),
      lastSeenAt: s(r.last_seen_at),
      isPro: Boolean(r.is_pro),
      qrTotal: n(r.qr_total),
      qrActive: n(r.qr_active),
    }));
    return { available: true, rows };
  } catch {
    return { available: false, rows: [] };
  }
}

export type AuditEntry = {
  id: string;
  adminUserId: string;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  createdAt: string;
};

/** Recent audit log with admin emails resolved in one extra query (no N+1). */
export async function getAuditLog(
  supabase: SupabaseClient,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ available: boolean; rows: AuditEntry[] }> {
  try {
    const limit = Math.min(Math.max(opts.limit ?? 100, 1), 200);
    const offset = Math.max(opts.offset ?? 0, 0);
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("id, admin_user_id, action, target_type, target_id, reason, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error || !data) return { available: false, rows: [] };

    const adminIds = [...new Set(data.map((r) => r.admin_user_id).filter(Boolean))];
    const emailById = new Map<string, string>();
    if (adminIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, email").in("id", adminIds);
      for (const p of profs ?? []) if (p.email) emailById.set(p.id, p.email);
    }
    return {
      available: true,
      rows: data.map((r) => ({
        id: r.id,
        adminUserId: r.admin_user_id,
        adminEmail: emailById.get(r.admin_user_id) ?? null,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        reason: r.reason,
        createdAt: r.created_at,
      })),
    };
  } catch {
    return { available: false, rows: [] };
  }
}

export { nOrNull };
