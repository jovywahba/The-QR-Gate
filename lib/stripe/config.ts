import { site } from "@/lib/site";

/** Stripe-facing config derived from site.ts + env. */
export const stripeConfig = {
  priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
  trialDays: site.pricing.trialDays,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
};
