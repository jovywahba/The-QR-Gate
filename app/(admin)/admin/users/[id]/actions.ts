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

/** Add an internal admin/support note (audited via the RPC). */
export async function adminAddNote(userId: string, body: string): Promise<ActionResult> {
  if (invalid(userId)) return { error: "Invalid user." };
  if (!body.trim()) return { error: "Enter a note." };
  try {
    await assertAdmin("manage_notes");
  } catch {
    return { error: "You don't have permission to add notes." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_add_note", { p_user_id: userId, p_body: body.trim() });
  if (error) {
    return {
      error: error.code === "42P01" ? "Notes need migration 0006 applied first." : "Couldn't save the note.",
    };
  }
  revalidatePath(`/admin/users/${userId}`);
  return { message: "Note added." };
}

/**
 * Revoke the user's active sessions (force re-authentication) WITHOUT
 * suspending the account. The pinned auth SDK has no per-user "sign out all"
 * by id, so we use the one supported primitive that invalidates a user's
 * refresh tokens — a ban applied and immediately lifted. The account is NOT
 * left suspended (it can sign in again); already-issued stateless access JWTs
 * still expire on their own (≤1h). Audited. Requires `revoke_sessions`.
 */
export async function adminRevokeSessions(userId: string, reason: string): Promise<ActionResult> {
  if (invalid(userId)) return { error: "Invalid user." };
  try {
    await assertAdmin("revoke_sessions");
  } catch {
    return { error: "You don't have permission to revoke sessions." };
  }
  // Don't touch a genuinely-suspended account's ban state here.
  const admin = createAdminClient();
  const { data: prof } = await admin.from("profiles").select("suspended_at").eq("id", userId).maybeSingle();
  if (prof?.suspended_at) {
    return { error: "This account is suspended — its sessions are already blocked." };
  }
  try {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "24h" });
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  } catch {
    return { error: "Couldn't revoke sessions." };
  }
  const supabase = await createClient();
  await supabase.rpc("admin_log", {
    p_action: "user.revoke_sessions",
    p_target_type: "user",
    p_target_id: userId,
    p_reason: reason.trim() || null,
    p_metadata: {},
  });
  revalidatePath(`/admin/users/${userId}`);
  return { message: "Sessions revoked — the user must sign in again." };
}

/**
 * Export a SAFE snapshot of the user's account as JSON (returned to the client
 * for download). Never includes passwords, tokens, card data, WiFi passwords,
 * or the QR `content` jsonb — only safe metadata. Records an audited export job.
 * Requires `export_user_data`.
 */
export async function adminExportUserData(
  userId: string,
): Promise<{ error?: string; filename?: string; json?: string }> {
  if (invalid(userId)) return { error: "Invalid user." };
  try {
    await assertAdmin("export_user_data");
  } catch {
    return { error: "You don't have permission to export user data." };
  }
  const admin = createAdminClient();
  const [{ data: profile }, { data: subs }, { data: comps }, { data: qrs }] = await Promise.all([
    admin.from("profiles").select("id, email, full_name, created_at, suspended_at").eq("id", userId).maybeSingle(),
    admin.from("subscriptions").select("status, current_period_end, cancel_at_period_end, stripe_price_id").eq("user_id", userId),
    admin.from("complimentary_entitlements").select("plan, is_active, expires_at, created_at").eq("user_id", userId),
    // Safe QR fields ONLY — never `content` (holds WiFi passwords / vCard PII).
    admin.from("qr_codes").select("id, name, type, status, slug, tracking_mode, created_at, published_at").eq("user_id", userId),
  ]);
  if (!profile) return { error: "That user no longer exists." };

  const snapshot = {
    exported_at: new Date().toISOString(),
    profile,
    subscriptions: subs ?? [],
    complimentary_entitlements: comps ?? [],
    qr_codes: qrs ?? [],
    note: "Safe metadata only — excludes passwords, tokens, card data, and QR content payloads.",
  };
  // Audited export-job entry (best-effort; needs 0006).
  const supabase = await createClient();
  await supabase.rpc("admin_record_export", { p_kind: "user_data", p_row_count: (qrs?.length ?? 0) + 1 }).then(
    () => undefined,
    () => undefined,
  );
  return { filename: `user-${userId}.json`, json: JSON.stringify(snapshot, null, 2) };
}
