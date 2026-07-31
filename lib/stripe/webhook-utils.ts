import type Stripe from "stripe";

/**
 * Pure helpers for the Stripe webhook (unit-tested, no client/secrets).
 */

/** Unix seconds → ISO string (null-safe). */
export function iso(seconds: number | null | undefined): string | null {
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

/**
 * `current_period_start`/`current_period_end` live on the Subscription in older
 * Stripe API versions and on the subscription ITEM in newer ones. Read whichever
 * is present so the renewal/cancel instant is captured regardless of the
 * account's default API version.
 */
export function subPeriod(
  sub: Stripe.Subscription,
  key: "current_period_start" | "current_period_end",
): number | null {
  const top = (sub as unknown as Record<string, unknown>)[key];
  if (typeof top === "number") return top;
  const item = sub.items?.data?.[0] as unknown as Record<string, unknown> | undefined;
  const fromItem = item?.[key];
  return typeof fromItem === "number" ? fromItem : null;
}
