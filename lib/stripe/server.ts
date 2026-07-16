import Stripe from "stripe";

/**
 * Server-only Stripe client for THIS app's dedicated account.
 * apiVersion is intentionally omitted so it tracks the account default;
 * pin it here if you need deterministic behavior.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});
