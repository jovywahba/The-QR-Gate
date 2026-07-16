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

/** Restore: published again if it ever had a slug + publish date, else draft. */
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

  const status = row.slug && row.published_at ? "published" : "draft";
  const { error } = await supabase.from("qr_codes").update({ status }).eq("id", qrCodeId);
  if (error) return { error: "Couldn't restore this QR code." };
  revalidatePath("/dashboard/qr-codes");
  return {};
}
