/**
 * Pure Stripe configuration predicates — read env only, no `server-only`
 * import and no Stripe client, so they're unit-testable and safe to import
 * anywhere on the server. The lazy Stripe client lives in ./server.
 *
 * Env contract (the ONLY names the code expects):
 *   STRIPE_SECRET_KEY            – server-only secret key
 *   STRIPE_WEBHOOK_SECRET        – server-only webhook signing secret
 *   STRIPE_PRICE_PRO_MONTHLY     – the $10/mo recurring Price id (server-only)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY – NOT required (checkout is hosted; kept optional)
 */

/** Present and not a placeholder stub. */
export function isRealValue(value: string | undefined): boolean {
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
