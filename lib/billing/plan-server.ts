import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_PLAN_FALLBACK, parsePlanStatus, type PlanStatus } from "./plan";

/**
 * Server-side plan lookup. Calls the security-definer RPC
 * get_user_plan_status() (auth.uid() scoped). If the RPC is missing
 * (schema not yet applied) or errors, it degrades to the free plan so
 * the app never hard-crashes — the authoritative quota gate is still
 * try_activate_qr() at publish time.
 */
export async function getPlanStatus(supabase: SupabaseClient): Promise<PlanStatus> {
  try {
    const { data, error } = await supabase.rpc("get_user_plan_status");
    if (error || data == null) return FREE_PLAN_FALLBACK;
    return parsePlanStatus(data);
  } catch {
    return FREE_PLAN_FALLBACK;
  }
}
