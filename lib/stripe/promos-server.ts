import "server-only";
import { formatDiscount } from "./promos";
import { getStripe } from "./server";

/**
 * Server-only Stripe reads for the admin Promo Codes page. Stripe is the
 * source of truth; we never store promo codes locally. Only admin-safe
 * display fields are returned (no secrets).
 */

export type PromoRow = {
  id: string; // Stripe promotion code id (admin-only; used to deactivate)
  code: string; // the customer-facing code
  active: boolean;
  discount: string; // formatted label, e.g. "25% off · first payment"
  timesRedeemed: number;
  maxRedemptions: number | null;
  expiresAt: number | null; // unix seconds
  created: number; // unix seconds
};

export async function listPromoCodes(): Promise<PromoRow[]> {
  const stripe = getStripe();
  const res = await stripe.promotionCodes.list({ limit: 100, expand: ["data.coupon"] });
  return res.data.map((p) => {
    const c = p.coupon;
    return {
      id: p.id,
      code: p.code,
      active: p.active,
      discount: formatDiscount({
        percentOff: c?.percent_off ?? null,
        amountOff: c?.amount_off ?? null,
        currency: c?.currency ?? null,
        duration: c?.duration ?? null,
        durationMonths: c?.duration_in_months ?? null,
      }),
      timesRedeemed: p.times_redeemed,
      maxRedemptions: p.max_redemptions ?? null,
      expiresAt: p.expires_at ?? null,
      created: p.created,
    };
  });
}
