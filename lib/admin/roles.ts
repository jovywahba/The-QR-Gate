/**
 * ───────────────────────────────────────────────────────────────
 * Admin roles + permission matrix (pure, dependency-free, unit-tested).
 *
 * This is the single source of truth for what each admin role may do in
 * the UI and in server actions. The database RE-CHECKS role membership
 * inside every privileged SECURITY DEFINER function, so this map is a
 * convenience/UX layer, never the only gate. Keep the two in sync:
 * SQL gates by role set, this gates by fine-grained permission.
 * ───────────────────────────────────────────────────────────────
 */

export const ADMIN_ROLES = ["super_admin", "admin", "support", "analyst"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
  analyst: "Analyst",
};

export type Permission =
  | "view_admin" // may reach /admin at all
  | "view_overview"
  | "view_users"
  | "view_user_detail"
  | "view_qr"
  | "view_analytics"
  | "view_subscriptions"
  | "view_audit"
  | "reset_password"
  | "suspend_users"
  | "revoke_sessions"
  | "moderate_qr"
  | "manage_entitlements"
  | "manage_admins"
  | "export_reports";

const ALL: Permission[] = [
  "view_admin", "view_overview", "view_users", "view_user_detail", "view_qr",
  "view_analytics", "view_subscriptions", "view_audit", "reset_password",
  "suspend_users", "revoke_sessions", "moderate_qr", "manage_entitlements",
  "manage_admins", "export_reports",
];

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
  super_admin: new Set(ALL),
  // Admin: everything except managing the admin team (no super-admin creation).
  admin: new Set(ALL.filter((p) => p !== "manage_admins")),
  // Support: read user/account info + QR records, and send password resets.
  support: new Set<Permission>([
    "view_admin", "view_overview", "view_users", "view_user_detail", "view_qr",
    "view_subscriptions", "reset_password",
  ]),
  // Analyst: read-only aggregate analytics; no private content, no mutations.
  analyst: new Set<Permission>(["view_admin", "view_overview", "view_analytics"]),
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/** Permissions a role holds (stable order) — handy for tests + debugging. */
export function permissionsFor(role: AdminRole): Permission[] {
  return ALL.filter((p) => hasPermission(role, p));
}
