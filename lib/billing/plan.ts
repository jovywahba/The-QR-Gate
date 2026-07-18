/**
 * ───────────────────────────────────────────────────────────────
 * Plan + quota model (client-safe, pure — no secrets, no env).
 *
 * Free accounts get 3 ACTIVE QR codes. "Active" == a published row
 * (drafts and archived rows don't count). Pro (Stripe status active
 * or trialing) is unlimited. The real enforcement is server-side
 * (public.try_activate_qr, race-safe); these helpers mirror that
 * logic for the UI and are unit-tested.
 * ───────────────────────────────────────────────────────────────
 */

export const FREE_ACTIVE_LIMIT = 3;
export const PRO_PLAN_NAME = "The QR Gate Pro";
export const PRO_PRICE_USD = 10;

/** Stripe statuses that grant unlimited creation. */
export function isProStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/** Would a new active QR be allowed given the plan + current active count? */
export function quotaAllows(isUnlimited: boolean, activeCount: number): boolean {
  return isUnlimited || activeCount < FREE_ACTIVE_LIMIT;
}

export type PlanKey = "anonymous" | "free" | "pro";

/** Normalized view of public.get_user_plan_status(). */
export type PlanStatus = {
  plan: PlanKey;
  /** Raw Stripe status when subscribed (past_due, canceled, …), else null. */
  status: string | null;
  isUnlimited: boolean;
  activeCount: number;
  /** null when unlimited (Pro). */
  limit: number | null;
  canCreate: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
};

/** A safe default when the plan RPC is unavailable (e.g. schema not yet applied). */
export const FREE_PLAN_FALLBACK: PlanStatus = {
  plan: "free",
  status: null,
  isUnlimited: false,
  activeCount: 0,
  limit: FREE_ACTIVE_LIMIT,
  canCreate: true,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  priceId: null,
};

/** Coerce the jsonb returned by get_user_plan_status() into a typed PlanStatus. */
export function parsePlanStatus(raw: unknown): PlanStatus {
  if (!raw || typeof raw !== "object") return FREE_PLAN_FALLBACK;
  const r = raw as Record<string, unknown>;
  const isUnlimited = Boolean(r.is_unlimited);
  const activeCount = typeof r.active_count === "number" ? r.active_count : 0;
  const planRaw = typeof r.plan === "string" ? r.plan : "free";
  const plan: PlanKey = planRaw === "pro" || planRaw === "anonymous" ? planRaw : "free";
  return {
    plan,
    status: typeof r.status === "string" ? r.status : null,
    isUnlimited,
    activeCount,
    limit: isUnlimited ? null : typeof r.limit === "number" ? r.limit : FREE_ACTIVE_LIMIT,
    canCreate: typeof r.can_create === "boolean" ? r.can_create : quotaAllows(isUnlimited, activeCount),
    currentPeriodEnd: typeof r.current_period_end === "string" ? r.current_period_end : null,
    cancelAtPeriodEnd: Boolean(r.cancel_at_period_end),
    priceId: typeof r.price_id === "string" ? r.price_id : null,
  };
}

/** Human label for a subscription status. */
export function statusLabel(status: string | null): string {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trialing";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    case "incomplete":
      return "Incomplete";
    case "incomplete_expired":
      return "Expired";
    default:
      return "Free";
  }
}
