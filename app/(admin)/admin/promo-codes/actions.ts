"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { isStripeConfigured } from "@/lib/stripe/config";
import { validatePromo, type RawPromo } from "@/lib/stripe/promos";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Create / deactivate discount codes for users. Each action:
 *   • re-checks the `manage_promotions` permission (assertAdmin),
 *   • validates + normalizes input server-side (never trusts raw form data),
 *   • creates a Stripe Coupon + Promotion Code (Stripe is the source of truth;
 *     checkout already allows promotion codes), and
 *   • writes an audit-log row.
 * No secret ever leaves the server; only a friendly message/id returns.
 */

export type PromoResult = { error?: string; message?: string };

async function audit(action: string, targetId: string, metadata: Record<string, unknown>) {
  try {
    const supabase = await createClient();
    await supabase.rpc("admin_log", {
      p_action: action,
      p_target_type: "promotion_code",
      p_target_id: targetId,
      p_reason: null,
      p_metadata: metadata,
    });
  } catch {
    /* audit is best-effort; never block the action */
  }
}

export async function createPromo(raw: RawPromo): Promise<PromoResult> {
  try {
    await assertAdmin("manage_promotions");
  } catch {
    return { error: "You don't have permission to manage promo codes." };
  }
  if (!isStripeConfigured()) return { error: "Stripe isn't configured on this deployment." };

  const v = validatePromo(raw);
  if (!v.ok) return { error: v.error };
  const input = v.value;

  try {
    const stripe = getStripe();
    const coupon = await stripe.coupons.create({
      name: input.code,
      duration: input.duration,
      ...(input.duration === "repeating" ? { duration_in_months: input.durationMonths } : {}),
      ...(input.percentOff != null
        ? { percent_off: input.percentOff }
        : { amount_off: input.amountOffCents, currency: input.currency }),
    });
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: input.code,
      ...(input.maxRedemptions ? { max_redemptions: input.maxRedemptions } : {}),
      ...(input.expiresAt ? { expires_at: input.expiresAt } : {}),
    });
    await audit("promo.create", promo.id, {
      code: input.code,
      duration: input.duration,
      percent_off: input.percentOff ?? null,
      amount_off_cents: input.amountOffCents ?? null,
    });
    revalidatePath("/admin/promo-codes");
    return { message: `Promo code ${input.code} created — customers can enter it at checkout.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/already exists|code.*taken|promotion code/i.test(msg)) {
      return { error: "That code already exists — choose a different one." };
    }
    return { error: "Couldn't create the promo code. Please try again." };
  }
}

export async function deactivatePromo(id: string): Promise<PromoResult> {
  try {
    await assertAdmin("manage_promotions");
  } catch {
    return { error: "You don't have permission to manage promo codes." };
  }
  if (!isStripeConfigured()) return { error: "Stripe isn't configured on this deployment." };
  if (!/^promo_[A-Za-z0-9]+$/.test(id)) return { error: "Invalid promo code." };

  try {
    const stripe = getStripe();
    await stripe.promotionCodes.update(id, { active: false });
    await audit("promo.deactivate", id, {});
    revalidatePath("/admin/promo-codes");
    return { message: "Promo code deactivated. Existing subscriptions keep their discount." };
  } catch {
    return { error: "Couldn't deactivate the promo code." };
  }
}
