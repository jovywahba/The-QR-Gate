"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Owner-only lifecycle actions. RLS is the real enforcement (updates
 * only match the caller's own rows); these actions never accept a
 * user id from the browser — the session decides.
 */

export type QRActionState = { error?: string };
export type QRDuplicateState = { error?: string; newId?: string };

function revalidateLists() {
  revalidatePath("/dashboard/qr-codes");
  revalidatePath("/dashboard");
}

/** Map a try_activate_qr rejection reason to an honest owner-facing message. */
function activationError(reason: string | undefined, verb: "unpause" | "restore"): string {
  switch (reason) {
    case "quota_exceeded":
      return `You've used all 3 free QR codes. Upgrade to Pro to ${verb} this one.`;
    case "moderation_locked":
      return "This QR code was paused by an administrator and can't be reactivated here. Contact support.";
    case "suspended":
      return "Your account is suspended.";
    default:
      return `Couldn't ${verb} this QR code.`;
  }
}

/**
 * Pause a published QR: its public page stops resolving (shows a paused
 * notice) while the record, slug, and analytics are preserved. A paused
 * QR is NOT 'published', so it stops counting against the free active
 * quota — freeing a slot, consistent with archive.
 */
export async function pauseQr(qrCodeId: string): Promise<QRActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { data, error } = await supabase
    .from("qr_codes")
    .update({ status: "paused", paused_at: new Date().toISOString() })
    .eq("id", qrCodeId)
    .eq("status", "published")
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { error: "Couldn't pause this QR code. Apply the latest database migration if this persists." };
  }
  revalidateLists();
  return {};
}

/**
 * Unpause: paused → published. Goes through try_activate_qr (the only
 * path allowed to publish) so the free quota is re-checked — a free user
 * already at the limit is told to upgrade instead of silently exceeding it.
 */
export async function unpauseQr(qrCodeId: string): Promise<QRActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { data: row } = await supabase
    .from("qr_codes")
    .select("id, status")
    .eq("id", qrCodeId)
    .maybeSingle();
  if (!row || row.status !== "paused") return { error: "This QR code isn't paused." };

  const { data: activation, error } = await supabase.rpc("try_activate_qr", { p_qr_id: qrCodeId });
  if (error) return { error: "Couldn't unpause this QR code." };
  const result = (activation ?? {}) as { allowed?: boolean; reason?: string };
  if (!result.allowed) return { error: activationError(result.reason, "unpause") };
  revalidateLists();
  return {};
}

/**
 * Duplicate a QR into a NEW draft. Copies the type, name (+" — Copy"),
 * content, and design/frame/template — but never the slug, analytics,
 * scan history, publication state, pause state, or schedule. The copy is
 * a draft, so it consumes no free slot until the user publishes it.
 *
 * Note: for upload-based types (PDF/images/file audio-video) the copied
 * content still references the original's private assets; those must be
 * re-uploaded on the copy before it can be published (asset ownership is
 * enforced at publish). URL/text types duplicate completely.
 */
export async function duplicateQr(qrCodeId: string): Promise<QRDuplicateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { data: src } = await supabase
    .from("qr_codes")
    .select("type, name, content, design")
    .eq("id", qrCodeId)
    .maybeSingle();
  if (!src) return { error: "QR code not found." };

  const copyName = `${(src.name ?? "").trim() || "Untitled"} — Copy`.slice(0, 120);
  const { data: created, error } = await supabase
    .from("qr_codes")
    .insert({
      user_id: user.id,
      type: src.type,
      name: copyName,
      status: "draft",
      content: src.content ?? {},
      design: src.design ?? {},
    })
    .select("id")
    .single();
  if (error || !created) return { error: "Couldn't duplicate this QR code." };
  revalidateLists();
  return { newId: created.id as string };
}

export async function archiveQr(qrCodeId: string): Promise<QRActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { data, error } = await supabase
    .from("qr_codes")
    .update({ status: "archived" })
    .eq("id", qrCodeId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Couldn't archive this QR code." };
  revalidatePath("/dashboard/qr-codes");
  return {};
}

/**
 * Restore: back to published if it ever had a slug + publish date, else draft.
 * Re-activating consumes a quota slot, so it goes through try_activate_qr (the
 * ONLY path allowed to publish) — a free user over the limit is told to upgrade
 * instead of silently exceeding it.
 */
export async function restoreQr(qrCodeId: string): Promise<QRActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { data: row } = await supabase
    .from("qr_codes")
    .select("id, slug, published_at")
    .eq("id", qrCodeId)
    .maybeSingle();
  if (!row) return { error: "QR code not found." };

  if (row.slug && row.published_at) {
    const { data: activation, error: rpcError } = await supabase.rpc("try_activate_qr", {
      p_qr_id: qrCodeId,
    });
    if (rpcError) {
      // Pre-0002 fallback: no function/trigger yet → direct update still works.
      const missingFn =
        rpcError.code === "PGRST202" || /find the function|does not exist/i.test(rpcError.message ?? "");
      if (!missingFn) return { error: "Couldn't restore this QR code." };
      const { error } = await supabase.from("qr_codes").update({ status: "published" }).eq("id", qrCodeId);
      if (error) return { error: "Couldn't restore this QR code." };
    } else {
      const result = (activation ?? {}) as { allowed?: boolean; reason?: string };
      if (!result.allowed) return { error: activationError(result.reason, "restore") };
    }
  } else {
    const { error } = await supabase.from("qr_codes").update({ status: "draft" }).eq("id", qrCodeId);
    if (error) return { error: "Couldn't restore this QR code." };
  }

  revalidatePath("/dashboard/qr-codes");
  return {};
}
