import "server-only";
import Stripe from "stripe";

/**
 * Server-only Stripe access for THIS app's dedicated account.
 *
 * Stripe is OPTIONAL for The QR Gate: the generator, auth, Supabase
 * publishing, downloads, the free plan, and scan analytics never touch
 * it. The client is created lazily inside request handlers — never at
 * module scope — so builds and deployments succeed with no Stripe env.
 * apiVersion is omitted so it tracks the account default.
 *
 * The pure config predicates live in ./config (unit-tested) and are
 * re-exported here for the existing "@/lib/stripe/server" imports.
 */

export { isRealValue, isStripeConfigured, proPriceId, isBillingConfigured } from "./config";

let client: Stripe | null = null;

/** Call only inside request handlers, after checking isStripeConfigured(). */
export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Stripe is not configured");
  }
  client ??= new Stripe(apiKey, { typescript: true });
  return client;
}
