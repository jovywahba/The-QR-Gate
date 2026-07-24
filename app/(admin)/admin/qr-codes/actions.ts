"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export type QrModResult = { error?: string; message?: string };

const UUID = /^[0-9a-f-]{36}$/i;

async function setStatus(qrId: string, status: "paused" | "published" | "archived", reason: string) {
  if (!UUID.test(qrId)) return { error: "Invalid QR code." };
  try {
    await assertAdmin("moderate_qr");
  } catch {
    return { error: "You don't have permission to moderate QR codes." };
  }
  const supabase = await createClient();
  // admin_set_qr_status re-checks the admin role AND writes the audit row atomically.
  const { error } = await supabase.rpc("admin_set_qr_status", {
    p_qr_id: qrId,
    p_status: status,
    p_reason: reason.trim() || null,
  });
  if (error) return { error: "Couldn't update this QR code." };
  revalidatePath("/admin/qr-codes");
  revalidatePath(`/admin/qr-codes/${qrId}`);
  return {};
}

export async function adminPauseQr(qrId: string, reason: string): Promise<QrModResult> {
  if (!reason.trim()) return { error: "A reason is required to pause a QR code." };
  const r = await setStatus(qrId, "paused", reason);
  return r.error ? r : { message: "QR code paused." };
}

export async function adminUnpauseQr(qrId: string, reason: string): Promise<QrModResult> {
  const r = await setStatus(qrId, "published", reason);
  return r.error ? r : { message: "QR code unpaused." };
}

export async function adminArchiveQr(qrId: string, reason: string): Promise<QrModResult> {
  const r = await setStatus(qrId, "archived", reason);
  return r.error ? r : { message: "QR code archived." };
}
