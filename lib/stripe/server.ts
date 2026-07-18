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
 */

/** A value that's present and not a placeholder stub. */
function isRealValue(value: string | undefined): boolean {
  return Boolean(value) && !value!.includes("placeholder");
}

/** True only when a usable secret key is present (placeholders don't count). */
export function isStripeConfigured(): boolean {
  return isRealValue(process.env.STRIPE_SECRET_KEY);
}

/** The Pro plan's Price id (server-only — never trust a client-supplied price). */
export function proPriceId(): string | undefined {
  const id = process.env.STRIPE_PRICE_PRO_MONTHLY;
  return isRealValue(id) ? id : undefined;
}

/** Checkout is possible only with both a secret key AND the Pro price configured. */
export function isBillingConfigured(): boolean {
  return isStripeConfigured() && Boolean(proPriceId());
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
