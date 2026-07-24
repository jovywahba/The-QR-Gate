"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { error?: string; message?: string };

/**
 * Update the signed-in user's display name. RLS scopes the profiles
 * update to their own row; we also mirror it into the auth metadata so
 * the greeting/avatar stay in sync everywhere. Never takes a user id
 * from the client — the session decides whose row is written.
 */
export async function updateDisplayName(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name || null })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save your name. Please try again." };

  // Keep the auth identity in sync so the greeting + avatar initials match.
  await supabase.auth.updateUser({ data: { full_name: name || null } });

  revalidatePath("/dashboard", "layout");
  return { message: "Your changes have been saved." };
}
