import "server-only";
import Stripe from "stripe";

/**
 * Server-only Stripe access for THIS app's dedicated account.
 *
 * Stripe is OPTIONAL for The QR Gate: the generator, auth, Supabase
 * publishing, and downloads never touch it. The client is therefore
 * created lazily inside request handlers — never at module scope —
 * so builds and deployments succeed with no Stripe env configured.
 * apiVersion is intentionally omitted so it tracks the account
 * default; pin it here if you need deterministic behavior.
 */

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

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
