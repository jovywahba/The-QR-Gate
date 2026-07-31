"use server";

import { adminGlobalSearch, type SearchQr, type SearchUser } from "@/lib/admin/data";
import { assertAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export type AdminSearchResult = {
  ok: boolean;
  users: SearchUser[];
  qrs: SearchQr[];
};

/**
 * Permission-aware admin global search. Gated by `global_search`; the RPC
 * itself only returns records the caller's role may see (analyst gets none).
 * Never throws to the client — returns an empty result if unauthorized or if
 * migration 0006 isn't applied yet.
 */
export async function runAdminSearch(query: string): Promise<AdminSearchResult> {
  const q = (query ?? "").trim();
  if (q.length < 2) return { ok: true, users: [], qrs: [] };
  try {
    await assertAdmin("global_search");
  } catch {
    return { ok: false, users: [], qrs: [] };
  }
  const supabase = await createClient();
  const res = await adminGlobalSearch(supabase, q);
  return { ok: res.available, users: res.users, qrs: res.qrs };
}
