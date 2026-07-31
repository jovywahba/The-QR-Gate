import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, isAdminRole, type AdminRole, type Permission } from "./roles";
import { recordSecurityEvent } from "./security";

/**
 * ───────────────────────────────────────────────────────────────
 * Centralized admin authorization. Every /admin route + every admin
 * server action funnels through here. It:
 *   1. verifies a real Supabase session (server-side),
 *   2. reads the caller's ACTIVE admin role from the database
 *      (public.current_admin_role — a security-definer function that
 *      reads admin_memberships, so metadata/URL/localStorage can't fake it),
 *   3. checks the required fine-grained permission,
 *   4. returns 404 for anyone who isn't authorized — the admin surface
 *      never confirms its own existence to non-admins.
 * The database independently re-checks membership inside every
 * privileged function, so a bypass of this layer still fails closed.
 * ───────────────────────────────────────────────────────────────
 */

export type AdminContext = { userId: string; email: string; role: AdminRole };

/** Resolve the caller's admin context, or null if they aren't an active admin. */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  try {
    const { data, error } = await supabase.rpc("current_admin_role");
    if (error || !isAdminRole(data)) return null;
    return { userId: user.id, email: user.email ?? "", role: data };
  } catch {
    return null;
  }
}

/** Gate a route/action. Missing session, non-admin, or missing permission → 404. */
export async function requireAdmin(permission: Permission = "view_admin"): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) notFound();
  if (!hasPermission(ctx.role, permission)) notFound();
  return ctx;
}

/**
 * Assert a permission inside a server action, throwing a plain Error (so the
 * action can return a friendly message) rather than rendering a 404.
 */
export async function assertAdmin(permission: Permission): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx || !hasPermission(ctx.role, permission)) {
    // Record the denied privileged action as a real security signal. Only when
    // a session exists (an authenticated caller lacking the permission), so we
    // don't spam on plain anonymous probes. Best-effort; never blocks.
    void recordSecurityEvent({
      eventType: "admin_permission_denied",
      severity: "warning",
      actorUserId: ctx?.userId ?? null,
      subject: permission,
      metadata: { role: ctx?.role ?? null },
    });
    throw new AdminForbiddenError();
  }
  return ctx;
}

export class AdminForbiddenError extends Error {
  constructor() {
    super("You don't have permission to do that.");
    this.name = "AdminForbiddenError";
  }
}
