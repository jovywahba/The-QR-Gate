"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { ADMIN_ROLES } from "@/lib/admin/roles";
import { wouldStrandSuperAdmins, type Membership } from "@/lib/admin/team-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type TeamResult = { error?: string; message?: string };

const LAST_SUPER_MSG =
  "You can't remove, demote, or disable the last active super admin. Promote another super admin first.";

/** Current admin roster (for the early last-super-admin pre-check). */
async function roster(): Promise<Membership[]> {
  const { data } = await createAdminClient()
    .from("admin_memberships")
    .select("user_id, role, is_active");
  return (data ?? []).map((m) => ({ userId: m.user_id, role: m.role, isActive: m.is_active }));
}

/** Grant/replace an admin role by email (SUPER ADMIN ONLY, DB-enforced). */
export async function adminSetRoleByEmail(
  email: string,
  role: string,
  reason: string,
): Promise<TeamResult> {
  try {
    await assertAdmin("manage_admins");
  } catch {
    return { error: "Only a super admin can manage the admin team." };
  }
  const clean = email.trim().toLowerCase();
  if (!clean) return { error: "Enter the user's email." };
  if (!(ADMIN_ROLES as readonly string[]).includes(role)) return { error: "Pick a valid role." };

  const admin = createAdminClient();
  const { data: prof } = await admin.from("profiles").select("id").ilike("email", clean).maybeSingle();
  if (!prof) return { error: "No account with that email. They must sign up first." };

  // Early defense-in-depth: don't let a demotion strand the last super admin
  // (the DB enforces this atomically too).
  if (wouldStrandSuperAdmins(await roster(), prof.id, role)) return { error: LAST_SUPER_MSG };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_role", {
    p_user_id: prof.id,
    p_role: role,
    p_reason: reason.trim() || null,
  });
  if (error) return { error: roleErrorMessage(error) };
  revalidatePath("/admin/team");
  return { message: "Admin role updated." };
}

/** Revoke admin membership (SUPER ADMIN ONLY). */
export async function adminRevokeRole(userId: string, reason: string): Promise<TeamResult> {
  try {
    await assertAdmin("manage_admins");
  } catch {
    return { error: "Only a super admin can manage the admin team." };
  }
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Invalid user." };
  if (wouldStrandSuperAdmins(await roster(), userId, "none")) return { error: LAST_SUPER_MSG };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_role", {
    p_user_id: userId,
    p_role: "none",
    p_reason: reason.trim() || null,
  });
  if (error) return { error: roleErrorMessage(error) };
  revalidatePath("/admin/team");
  return { message: "Admin access revoked." };
}

/** Map DB error codes from admin_grant_role to friendly, honest messages. */
function roleErrorMessage(error: { code?: string; message?: string }): string {
  // P0001 = the last-super-admin guard (0006). 42501 = self-change / forbidden.
  if (error.code === "P0001" || /last active super admin/i.test(error.message ?? "")) {
    return "You can't remove, demote, or disable the last active super admin. Promote another super admin first.";
  }
  if (error.code === "42501") return "You can't change your own admin role.";
  return "Couldn't update the role.";
}
