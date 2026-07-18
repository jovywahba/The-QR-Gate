"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Owner-only lifecycle actions. RLS is the real enforcement (updates
 * only match the caller's own rows); these actions never accept a
 * user id from the browser — the session decides.
 */

export type QRActionState = { error?: string };

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
      if (!result.allowed) {
        return result.reason === "quota_exceeded"
          ? { error: "You've used all 3 free QR codes. Upgrade to Pro to restore this one as active." }
          : { error: "Couldn't restore this QR code." };
      }
    }
  } else {
    const { error } = await supabase.from("qr_codes").update({ status: "draft" }).eq("id", qrCodeId);
    if (error) return { error: "Couldn't restore this QR code." };
  }

  revalidatePath("/dashboard/qr-codes");
  return {};
}
