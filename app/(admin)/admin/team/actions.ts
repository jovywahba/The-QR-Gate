"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { ADMIN_ROLES } from "@/lib/admin/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type TeamResult = { error?: string; message?: string };

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

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_role", {
    p_user_id: prof.id,
    p_role: role,
    p_reason: reason.trim() || null,
  });
  if (error) {
    return { error: error.code === "42501" ? "You can't change your own role." : "Couldn't update the role." };
  }
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
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_role", {
    p_user_id: userId,
    p_role: "none",
    p_reason: reason.trim() || null,
  });
  if (error) {
    return { error: error.code === "42501" ? "You can't remove your own role." : "Couldn't revoke the role." };
  }
  revalidatePath("/admin/team");
  return { message: "Admin access revoked." };
}
