import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  hasPermission,
  isAdminRole,
  permissionsFor,
  type AdminRole,
  type Permission,
} from "../roles";

describe("isAdminRole", () => {
  it("accepts only the four real roles", () => {
    for (const r of ADMIN_ROLES) expect(isAdminRole(r)).toBe(true);
    for (const bad of ["", "root", "owner", null, undefined, 1]) expect(isAdminRole(bad)).toBe(false);
  });
});

// The authoritative allow/deny expectations. The database re-checks role sets
// inside every privileged function; this keeps the UI/action layer honest.
const EXPECT: Record<AdminRole, Partial<Record<Permission, boolean>>> = {
  super_admin: {
    view_admin: true, manage_admins: true, suspend_users: true, moderate_qr: true,
    manage_entitlements: true, reset_password: true, view_audit: true, export_reports: true,
    view_reports: true, view_security: true, view_system_health: true, view_support: true,
    global_search: true, manage_notes: true, revoke_sessions: true, export_user_data: true,
    manage_promotions: true,
  },
  admin: {
    view_admin: true, manage_admins: false, suspend_users: true, moderate_qr: true,
    manage_entitlements: true, reset_password: true, view_audit: true, export_reports: true,
    view_reports: true, view_security: true, view_system_health: true, view_support: true,
    global_search: true, manage_notes: true, revoke_sessions: true, export_user_data: true,
    manage_promotions: true,
  },
  support: {
    view_admin: true, view_users: true, view_user_detail: true, view_qr: true,
    reset_password: true, suspend_users: false, moderate_qr: false, manage_entitlements: false,
    manage_admins: false, view_analytics: false, view_audit: false,
    // Support gets the read-only support surface, notes, and search — nothing else new.
    view_support: true, manage_notes: true, global_search: true,
    view_reports: false, view_security: false, view_system_health: false,
    revoke_sessions: false, export_user_data: false,
  },
  analyst: {
    view_admin: true, view_overview: true, view_analytics: true,
    view_users: false, view_user_detail: false, view_qr: false, reset_password: false,
    suspend_users: false, moderate_qr: false, manage_entitlements: false, manage_admins: false,
    view_audit: false, export_reports: false,
    // Analyst gets read-only system health, but no private/search/mutation.
    view_system_health: true, view_support: false, view_security: false, view_reports: false,
    global_search: false, manage_notes: false, revoke_sessions: false, export_user_data: false,
  },
};

describe("role permission matrix", () => {
  for (const role of ADMIN_ROLES) {
    for (const [perm, allowed] of Object.entries(EXPECT[role]) as [Permission, boolean][]) {
      it(`${role} ${allowed ? "may" : "may NOT"} ${perm}`, () => {
        expect(hasPermission(role, perm)).toBe(allowed);
      });
    }
  }

  it("only super_admin may manage other admins", () => {
    expect(hasPermission("super_admin", "manage_admins")).toBe(true);
    expect(hasPermission("admin", "manage_admins")).toBe(false);
    expect(hasPermission("support", "manage_admins")).toBe(false);
    expect(hasPermission("analyst", "manage_admins")).toBe(false);
  });

  it("analyst gets no user-mutation or private-content permission", () => {
    const perms = permissionsFor("analyst");
    for (const forbidden of ["suspend_users", "moderate_qr", "manage_entitlements", "view_user_detail", "view_qr"] as Permission[]) {
      expect(perms).not.toContain(forbidden);
    }
  });

  it("support cannot change billing/entitlements or roles", () => {
    for (const forbidden of ["manage_entitlements", "manage_admins", "suspend_users", "moderate_qr"] as Permission[]) {
      expect(hasPermission("support", forbidden)).toBe(false);
    }
  });
});
