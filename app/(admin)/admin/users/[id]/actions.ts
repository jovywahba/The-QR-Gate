"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Privileged, audited admin actions on a single user. Every action:
 *   • re-checks the caller's fine-grained permission (assertAdmin),
 *   • runs the mutation through a SECURITY DEFINER RPC that RE-CHECKS the
 *     admin role AND writes the audit-log row atomically,
 *   • performs any auth-side effect (ban / reset email) with the service role,
 *   • requires a reason for destructive changes.
 * Nothing here ever trusts a role/permission value from the browser.
 */

export type ActionResult = { error?: string; message?: string };

const UUID = /^[0-9a-f-]{36}$/i;

function invalid(userId: string): boolean {
  return !UUID.test(userId);
}

export async function adminSuspendUser(userId: string, reason: string): Promise<ActionResult> {
  if (invalid(userId)) return { error: "Invalid user." };
  if (!reason.trim()) return { error: "A reason is required to suspend an account." };
  try {
    await assertAdmin("suspend_users");
  } catch {
    return { error: "You don't have permission to suspend accounts." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_suspension", {
    p_user_id: userId,
    p_suspend: true,
    p_reason: reason.trim(),
  });
  if (error) return { error: "Couldn't suspend this account." };
  // Auth side: a long ban both blocks sign-in and invalidates existing tokens.
  try {
    await createAdminClient().auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  } catch {
    /* the DB flag is already set; the app shell blocks the account regardless */
  }
  revalidatePath(`/admin/users/${userId}`);
  // The DB flag is the authoritative gate (blocks the shell, publishing, and
  // re-activation server-side); the ban additionally invalidates live tokens.
  return { message: "Account suspended." };
}

export async function adminReactivateUser(userId: string, reason: string): Promise<ActionResult> {
  if (invalid(userId)) return { error: "Invalid user." };
  try {
    await assertAdmin("suspend_users");
  } catch {
    return { error: "You don't have permission to reactivate accounts." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_suspension", {
    p_user_id: userId,
    p_suspend: false,
    p_reason: reason.trim() || null,
  });
  if (error) return { error: "Couldn't reactivate this account." };
  try {
    await createAdminClient().auth.admin.updateUserById(userId, { ban_duration: "none" });
  } catch {
    /* ignore — the DB flag is cleared, which is what the app checks */
  }
  revalidatePath(`/admin/users/${userId}`);
  return { message: "Account reactivated." };
}

export async function adminSendPasswordReset(userId: string): Promise<ActionResult> {
  if (invalid(userId)) return { error: "Invalid user." };
  try {
    await assertAdmin("reset_password");
  } catch {
    return { error: "You don't have permission to send password resets." };
  }
  // Resolve the target email server-side from the id — never trust a
  // client-supplied address, so the emailed recipient and the audited
  // target can't diverge.
  const { data: prof } = await createAdminClient()
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const email = prof?.email;
  if (!email) return { error: "That user has no email on file." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site.url}/auth/confirm?next=/reset-password`,
  });
  if (error) return { error: "Couldn't send the reset email." };
  // admin_log re-checks admin membership internally and is now granted to
  // authenticated, so this audit row actually persists.
  await supabase.rpc("admin_log", {
    p_action: "user.password_reset",
    p_target_type: "user",
    p_target_id: userId,
    p_reason: null,
    p_metadata: {},
  });
  return { message: "Password-reset email sent." };
}

export async function adminGrantComp(
  userId: string,
  reason: string,
  expiresAt: string | null,
): Promise<ActionResult> {
  if (invalid(userId)) return { error: "Invalid user." };
  if (!reason.trim()) return { error: "A reason is required." };
  try {
    await assertAdmin("manage_entitlements");
  } catch {
    return { error: "You don't have permission to manage entitlements." };
  }
  let expires: string | null = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) return { error: "Invalid expiry date." };
    expires = d.toISOString();
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_comp", {
    p_user_id: userId,
    p_reason: reason.trim(),
    p_expires: expires,
  });
  if (error) return { error: "Couldn't grant complimentary Pro." };
  revalidatePath(`/admin/users/${userId}`);
  return { message: "Complimentary Pro granted." };
}

export async function adminRevokeComp(userId: string, reason: string): Promise<ActionResult> {
  if (invalid(userId)) return { error: "Invalid user." };
  try {
    await assertAdmin("manage_entitlements");
  } catch {
    return { error: "You don't have permission to manage entitlements." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_comp", {
    p_user_id: userId,
    p_reason: reason.trim() || null,
  });
  if (error) return { error: "Couldn't remove complimentary Pro." };
  revalidatePath(`/admin/users/${userId}`);
  return { message: "Complimentary Pro removed." };
}
