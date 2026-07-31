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
  archivedQr: number;
  totalScans: number;
  scansToday: number;
  scans30d: number;
  botScans30d: number;
  uniqueVisitors30d: number;
  proAccounts: number;
  trialingAccounts: number;
  pastDueAccounts: number;
  compAccounts: number;
  presenceByRoute: Record<string, number>;
};

const EMPTY_OVERVIEW: AdminOverview = {
  available: false,
  totalUsers: 0, newUsersToday: 0, newUsersMonth: 0, onlineNow: 0, activeToday: 0,
  totalQr: 0, activeQr: 0, pausedQr: 0, archivedQr: 0, totalScans: 0, scansToday: 0, scans30d: 0,
  botScans30d: 0, uniqueVisitors30d: 0, proAccounts: 0, trialingAccounts: 0, pastDueAccounts: 0,
  compAccounts: 0, presenceByRoute: {},
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
      archivedQr: n(r.archived_qr),
      totalScans: n(r.total_scans),
      scansToday: n(r.scans_today),
      scans30d: n(r.scans_30d),
      botScans30d: n(r.bot_scans_30d),
      uniqueVisitors30d: n(r.unique_visitors_30d),
      proAccounts: n(r.pro_accounts),
      trialingAccounts: n(r.trialing_accounts),
      pastDueAccounts: n(r.past_due_accounts),
      compAccounts: n(r.comp_accounts),
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

/* ─────────────────────────────────────────────────────────────
 * Phase-2 fetchers. Each calls a 0006 admin-gated RPC and degrades to
 * `available: false` (never fake data) when 0006 isn't applied yet.
 * ───────────────────────────────────────────────────────────── */

function b(v: unknown): boolean {
  return Boolean(v);
}

export type DayCount = { day: string; count: number };
export type LabelCount = { label: string; count: number };
export type AdminAnalytics = {
  available: boolean;
  rangeFrom: string | null;
  rangeTo: string | null;
  scansByDay: DayCount[];
  visitorsByDay: DayCount[];
  registrationsByDay: DayCount[];
  qrCreationByDay: DayCount[];
  typeDistribution: LabelCount[];
  trackingDistribution: LabelCount[];
  topQrs: { id: string; name: string | null; slug: string | null; type: string; scans: number }[];
  countries: LabelCount[];
  devices: LabelCount[];
  browsers: LabelCount[];
  operatingSystems: LabelCount[];
  referrers: LabelCount[];
  botScans: number;
  humanScans: number;
  conversion: { signups: number; publishedFirstQr: number };
};

function days(v: unknown): DayCount[] {
  return Array.isArray(v)
    ? v.map((x) => ({ day: String((x as Record<string, unknown>).day ?? ""), count: n((x as Record<string, unknown>).count) }))
    : [];
}
function labels(v: unknown, key: string): LabelCount[] {
  return Array.isArray(v)
    ? v.map((x) => {
        const r = x as Record<string, unknown>;
        return { label: String(r[key] ?? r.label ?? "Unknown"), count: n(r.count) };
      })
    : [];
}

export async function getAdminAnalytics(
  supabase: SupabaseClient,
  from: Date,
  to: Date,
): Promise<AdminAnalytics> {
  const empty: AdminAnalytics = {
    available: false, rangeFrom: null, rangeTo: null, scansByDay: [], visitorsByDay: [],
    registrationsByDay: [], qrCreationByDay: [], typeDistribution: [], trackingDistribution: [],
    topQrs: [], countries: [], devices: [], browsers: [], operatingSystems: [], referrers: [],
    botScans: 0, humanScans: 0, conversion: { signups: 0, publishedFirstQr: 0 },
  };
  try {
    const { data, error } = await supabase.rpc("admin_analytics", {
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    });
    if (error || !data || typeof data !== "object") return empty;
    const r = data as Record<string, unknown>;
    const conv = (r.conversion ?? {}) as Record<string, unknown>;
    const top = Array.isArray(r.top_qrs) ? (r.top_qrs as Array<Record<string, unknown>>) : [];
    return {
      available: true,
      rangeFrom: s(r.range_from),
      rangeTo: s(r.range_to),
      scansByDay: days(r.scans_by_day),
      visitorsByDay: days(r.visitors_by_day),
      registrationsByDay: days(r.registrations_by_day),
      qrCreationByDay: days(r.qr_creation_by_day),
      typeDistribution: labels(r.type_distribution, "type"),
      trackingDistribution: labels(r.tracking_distribution, "mode"),
      topQrs: top.map((x) => ({
        id: String(x.id), name: s(x.name), slug: s(x.slug), type: String(x.type ?? ""), scans: n(x.scans),
      })),
      countries: labels(r.countries, "label"),
      devices: labels(r.devices, "label"),
      browsers: labels(r.browsers, "label"),
      operatingSystems: labels(r.operating_systems, "label"),
      referrers: labels(r.referrers, "label"),
      botScans: n(r.bot_scans),
      humanScans: n(r.human_scans),
      conversion: { signups: n(conv.signups), publishedFirstQr: n(conv.published_first_qr) },
    };
  } catch {
    return empty;
  }
}

export type AdminQrRow = {
  id: string;
  name: string | null;
  type: string;
  status: string;
  slug: string | null;
  trackingMode: string | null;
  destinationUrl: string | null;
  ownerId: string;
  ownerEmail: string | null;
  scans: number;
  uniqueVisitors: number;
  lastScanAt: string | null;
  versionCount: number;
  createdAt: string | null;
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  moderationLocked: boolean;
};

export type AdminQrFilter =
  | "all" | "published" | "draft" | "paused" | "archived" | "scheduled" | "expired";

export async function listAdminQrs(
  supabase: SupabaseClient,
  opts: { search?: string; filter?: AdminQrFilter; limit?: number; offset?: number } = {},
): Promise<{ available: boolean; rows: AdminQrRow[] }> {
  try {
    const { data, error } = await supabase.rpc("admin_qr_list", {
      p_search: opts.search?.trim() || null,
      p_filter: opts.filter ?? "all",
      p_limit: opts.limit ?? 50,
      p_offset: opts.offset ?? 0,
    });
    if (error || !Array.isArray(data)) return { available: false, rows: [] };
    const rows = (data as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      name: s(r.name),
      type: String(r.type ?? ""),
      status: String(r.status ?? ""),
      slug: s(r.slug),
      trackingMode: s(r.tracking_mode),
      destinationUrl: s(r.destination_url),
      ownerId: String(r.owner_id),
      ownerEmail: s(r.owner_email),
      scans: n(r.scans),
      uniqueVisitors: n(r.unique_visitors),
      lastScanAt: s(r.last_scan_at),
      versionCount: n(r.version_count),
      createdAt: s(r.created_at),
      publishedAt: s(r.published_at),
      startsAt: s(r.starts_at),
      endsAt: s(r.ends_at),
      moderationLocked: b(r.moderation_locked),
    }));
    return { available: true, rows };
  } catch {
    return { available: false, rows: [] };
  }
}

export type AdminSubRow = {
  userId: string;
  email: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  activeQr: number;
};

export async function listAdminSubscriptions(
  supabase: SupabaseClient,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ available: boolean; rows: AdminSubRow[] }> {
  try {
    const { data, error } = await supabase.rpc("admin_subscriptions_list", {
      p_limit: opts.limit ?? 100,
      p_offset: opts.offset ?? 0,
    });
    if (error || !Array.isArray(data)) return { available: false, rows: [] };
    const rows = (data as Array<Record<string, unknown>>).map((r) => ({
      userId: String(r.user_id),
      email: s(r.email),
      status: String(r.status ?? ""),
      currentPeriodEnd: s(r.current_period_end),
      cancelAtPeriodEnd: b(r.cancel_at_period_end),
      priceId: s(r.stripe_price_id),
      activeQr: n(r.active_qr),
    }));
    return { available: true, rows };
  } catch {
    return { available: false, rows: [] };
  }
}

export type AuditQueryResult = { available: boolean; total: number; rows: (AuditEntry & { metadata: Record<string, unknown> })[] };

export async function queryAuditLog(
  supabase: SupabaseClient,
  opts: {
    action?: string | null;
    adminId?: string | null;
    targetType?: string | null;
    from?: string | null;
    to?: string | null;
    limit?: number;
    offset?: number;
  } = {},
): Promise<AuditQueryResult> {
  try {
    const { data, error } = await supabase.rpc("admin_audit_query", {
      p_action: opts.action || null,
      p_admin_id: opts.adminId || null,
      p_target_type: opts.targetType || null,
      p_from: opts.from || null,
      p_to: opts.to || null,
      p_limit: opts.limit ?? 50,
      p_offset: opts.offset ?? 0,
    });
    if (error || !data || typeof data !== "object") return { available: false, total: 0, rows: [] };
    const r = data as Record<string, unknown>;
    const rows = Array.isArray(r.rows) ? (r.rows as Array<Record<string, unknown>>) : [];
    return {
      available: true,
      total: n(r.total),
      rows: rows.map((x) => ({
        id: String(x.id),
        adminUserId: String(x.admin_user_id),
        adminEmail: s(x.admin_email),
        action: String(x.action ?? ""),
        targetType: s(x.target_type),
        targetId: s(x.target_id),
        reason: s(x.reason),
        createdAt: String(x.created_at ?? ""),
        metadata: (x.metadata && typeof x.metadata === "object" ? x.metadata : {}) as Record<string, unknown>,
      })),
    };
  } catch {
    return { available: false, total: 0, rows: [] };
  }
}

export type SearchUser = { id: string; email: string | null; fullName: string | null; suspended: boolean };
export type SearchQr = { id: string; name: string | null; slug: string | null; type: string; status: string };

export async function adminGlobalSearch(
  supabase: SupabaseClient,
  query: string,
): Promise<{ available: boolean; users: SearchUser[]; qrs: SearchQr[] }> {
  try {
    const { data, error } = await supabase.rpc("admin_global_search", { p_query: query, p_limit: 8 });
    if (error || !data || typeof data !== "object") return { available: false, users: [], qrs: [] };
    const r = data as Record<string, unknown>;
    const users = Array.isArray(r.users) ? (r.users as Array<Record<string, unknown>>) : [];
    const qrs = Array.isArray(r.qrs) ? (r.qrs as Array<Record<string, unknown>>) : [];
    return {
      available: true,
      users: users.map((u) => ({ id: String(u.id), email: s(u.email), fullName: s(u.full_name), suspended: b(u.suspended) })),
      qrs: qrs.map((q) => ({ id: String(q.id), name: s(q.name), slug: s(q.slug), type: String(q.type ?? ""), status: String(q.status ?? "") })),
    };
  } catch {
    return { available: false, users: [], qrs: [] };
  }
}

export type UserNote = { id: string; body: string; createdAt: string; authorId: string; authorEmail: string | null };

export async function listUserNotes(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ available: boolean; rows: UserNote[] }> {
  try {
    const { data, error } = await supabase.rpc("admin_list_notes", { p_user_id: userId });
    if (error || !Array.isArray(data)) return { available: false, rows: [] };
    return {
      available: true,
      rows: (data as Array<Record<string, unknown>>).map((x) => ({
        id: String(x.id), body: String(x.body ?? ""), createdAt: String(x.created_at ?? ""),
        authorId: String(x.author_id), authorEmail: s(x.author_email),
      })),
    };
  } catch {
    return { available: false, rows: [] };
  }
}

export type SecurityEvent = {
  id: string;
  eventType: string;
  severity: string;
  actorUserId: string | null;
  subject: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function listSecurityEvents(
  supabase: SupabaseClient,
  opts: { type?: string | null; limit?: number } = {},
): Promise<{ available: boolean; rows: SecurityEvent[] }> {
  try {
    const { data, error } = await supabase.rpc("admin_security_events", {
      p_type: opts.type || null,
      p_limit: opts.limit ?? 100,
    });
    if (error || !Array.isArray(data)) return { available: false, rows: [] };
    return {
      available: true,
      rows: (data as Array<Record<string, unknown>>).map((x) => ({
        id: String(x.id), eventType: String(x.event_type ?? ""), severity: String(x.severity ?? "info"),
        actorUserId: s(x.actor_user_id), subject: s(x.subject),
        metadata: (x.metadata && typeof x.metadata === "object" ? x.metadata : {}) as Record<string, unknown>,
        createdAt: String(x.created_at ?? ""),
      })),
    };
  } catch {
    return { available: false, rows: [] };
  }
}

export type ExportJob = { id: string; kind: string; status: string; rowCount: number | null; createdAt: string; createdBy: string };

export async function listExportJobs(
  supabase: SupabaseClient,
  limit = 50,
): Promise<{ available: boolean; rows: ExportJob[] }> {
  try {
    const { data, error } = await supabase
      .from("admin_export_jobs")
      .select("id, kind, status, row_count, created_at, created_by")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return { available: false, rows: [] };
    return {
      available: true,
      rows: data.map((x) => ({
        id: String(x.id), kind: String(x.kind ?? ""), status: String(x.status ?? ""),
        rowCount: nOrNull(x.row_count), createdAt: String(x.created_at ?? ""), createdBy: String(x.created_by),
      })),
    };
  } catch {
    return { available: false, rows: [] };
  }
}

export { nOrNull };
