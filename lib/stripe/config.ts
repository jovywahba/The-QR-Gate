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

/**
 * Coarse mode of the secret key from its PREFIX only — never returns or logs
 * the key itself. Unknown/absent prefixes are "unset" (not usable).
 */
export function secretKeyMode(): "live" | "test" | "unset" {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!isRealValue(k)) return "unset";
  if (k!.startsWith("sk_live_") || k!.startsWith("rk_live_")) return "live";
  if (k!.startsWith("sk_test_") || k!.startsWith("rk_test_")) return "test";
  return "unset";
}

/**
 * The Vercel deployment environment ("production" | "preview" | "development",
 * or "" when not on Vercel, e.g. local dev). Drives the live-key requirement.
 */
export function deployEnv(): string {
  return process.env.VERCEL_ENV ?? "";
}

/** Vercel PRODUCTION must run a LIVE secret key; preview/dev may use Sandbox. */
export function requiresLiveKey(): boolean {
  return deployEnv() === "production";
}

/** In production a test key is NOT acceptable; elsewhere Sandbox keys are fine. */
export function liveKeySatisfied(): boolean {
  return !requiresLiveKey() || secretKeyMode() === "live";
}

/**
 * Checkout is possible only with a secret key AND the Pro price configured AND
 * — in production — a LIVE key (a test key in prod is rejected here, so the
 * paywall shows "unconfigured" and never charges through a Sandbox key).
 */
export function isBillingConfigured(): boolean {
  return isStripeConfigured() && Boolean(proPriceId()) && liveKeySatisfied();
}

/**
 * Should a webhook event be processed given the key mode? A live webhook secret
 * only signs live events (livemode true) and a test secret only test events
 * (livemode false); the signature already blocks cross-mode delivery, and this
 * is the explicit belt-and-suspenders check. Unknown key mode → don't gate.
 */
export function eventMatchesKeyMode(eventLivemode: boolean): boolean {
  const mode = secretKeyMode();
  if (mode === "unset") return true;
  return eventLivemode === (mode === "live");
}
