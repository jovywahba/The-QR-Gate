"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Owner-scoped folders + tags. RLS is the real enforcement (every table
 * in migration 0005 is scoped to auth.uid()); these actions additionally
 * verify ownership before cross-referencing (so a QR can't be filed into
 * — or tagged with — another user's folder/tag).
 */

export type OrgResult = { error?: string };
export type CreateResult = { error?: string; id?: string };

const UUID = /^[0-9a-f-]{36}$/i;
function rev() {
  revalidatePath("/dashboard/qr-codes");
}

async function user() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Folders ──────────────────────────────────────────────────────
export async function createFolder(name: string): Promise<CreateResult> {
  const n = name.trim().slice(0, 60);
  if (!n) return { error: "Enter a folder name." };
  const { supabase, user: u } = await user();
  if (!u) return { error: "Sign in first." };
  const { data, error } = await supabase.from("qr_folders").insert({ user_id: u.id, name: n }).select("id").single();
  if (error || !data) return { error: "Couldn't create the folder." };
  rev();
  return { id: data.id as string };
}

export async function renameFolder(id: string, name: string): Promise<OrgResult> {
  const n = name.trim().slice(0, 60);
  if (!UUID.test(id) || !n) return { error: "Enter a valid name." };
  const { supabase, user: u } = await user();
  if (!u) return { error: "Sign in first." };
  const { data, error } = await supabase.from("qr_folders").update({ name: n }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { error: "Couldn't rename the folder." };
  rev();
  return {};
}

/** Deleting a folder is safe: its QRs' folder_id is set null by the FK, not deleted. */
export async function deleteFolder(id: string): Promise<OrgResult> {
  if (!UUID.test(id)) return { error: "Invalid folder." };
  const { supabase, user: u } = await user();
  if (!u) return { error: "Sign in first." };
  const { error } = await supabase.from("qr_folders").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the folder." };
  rev();
  return {};
}

// ── Tags ─────────────────────────────────────────────────────────
export async function createTag(name: string): Promise<CreateResult> {
  const n = name.trim().slice(0, 40);
  if (!n) return { error: "Enter a tag name." };
  const { supabase, user: u } = await user();
  if (!u) return { error: "Sign in first." };
  const { data, error } = await supabase
    .from("qr_tags")
    .insert({ user_id: u.id, name: n })
    .select("id")
    .single();
  if (error) {
    return { error: error.code === "23505" ? "You already have a tag with that name." : "Couldn't create the tag." };
  }
  rev();
  return { id: data.id as string };
}

export async function renameTag(id: string, name: string): Promise<OrgResult> {
  const n = name.trim().slice(0, 40);
  if (!UUID.test(id) || !n) return { error: "Enter a valid name." };
  const { supabase, user: u } = await user();
  if (!u) return { error: "Sign in first." };
  const { data, error } = await supabase.from("qr_tags").update({ name: n }).eq("id", id).select("id").maybeSingle();
  if (error) return { error: error.code === "23505" ? "You already have a tag with that name." : "Couldn't rename the tag." };
  if (!data) return { error: "Tag not found." };
  rev();
  return {};
}

export async function deleteTag(id: string): Promise<OrgResult> {
  if (!UUID.test(id)) return { error: "Invalid tag." };
  const { supabase, user: u } = await user();
  if (!u) return { error: "Sign in first." };
  const { error } = await supabase.from("qr_tags").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the tag." };
  rev();
  return {};
}

// ── Assignment ───────────────────────────────────────────────────
export async function setQrFolder(qrId: string, folderId: string | null): Promise<OrgResult> {
  if (!UUID.test(qrId)) return { error: "Invalid QR code." };
  const { supabase, user: u } = await user();
  if (!u) return { error: "Sign in first." };
  if (folderId) {
    if (!UUID.test(folderId)) return { error: "Invalid folder." };
    // RLS returns the folder only if the caller owns it.
    const { data: owned } = await supabase.from("qr_folders").select("id").eq("id", folderId).maybeSingle();
    if (!owned) return { error: "That folder doesn't exist." };
  }
  const { data, error } = await supabase
    .from("qr_codes")
    .update({ folder_id: folderId })
    .eq("id", qrId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Couldn't move the QR code." };
  rev();
  return {};
}

/** Replace a QR's tag set. Only the caller's own tags are attached (RLS-enforced). */
export async function setQrTags(qrId: string, tagIds: string[]): Promise<OrgResult> {
  if (!UUID.test(qrId)) return { error: "Invalid QR code." };
  const clean = [...new Set((tagIds ?? []).filter((t) => UUID.test(t)))];
  const { supabase, user: u } = await user();
  if (!u) return { error: "Sign in first." };

  // Keep only tags the caller actually owns.
  let owned: string[] = [];
  if (clean.length > 0) {
    const { data } = await supabase.from("qr_tags").select("id").in("id", clean);
    owned = (data ?? []).map((r) => r.id);
  }

  // Replace: clear existing links for this (owned) QR, then insert the new set.
  const del = await supabase.from("qr_code_tags").delete().eq("qr_code_id", qrId);
  if (del.error) return { error: "Couldn't update tags." };
  if (owned.length > 0) {
    const { error } = await supabase
      .from("qr_code_tags")
      .insert(owned.map((tag_id) => ({ qr_code_id: qrId, tag_id })));
    if (error) return { error: "Couldn't update tags." };
  }
  rev();
  return {};
}
