import "server-only";
import {
  deployEnv,
  isStripeConfigured,
  liveKeySatisfied,
  proPriceId,
  requiresLiveKey,
  secretKeyMode,
} from "./config";
import { evaluatePrice, type PriceEvaluation } from "./price-check";
import { getStripe } from "./server";

/**
 * ───────────────────────────────────────────────────────────────
 * Stripe billing self-verification. The Live price's properties (active /
 * USD / $10 / monthly / product name / live-mode) can only be checked by code
 * running WITH the Live key — which lives only in Vercel Production. This runs
 * there and returns a SAFE result: booleans and coarse labels only. It NEVER
 * returns a key, a price/product/customer id, or any Stripe payload.
 * ───────────────────────────────────────────────────────────────
 */

export type BillingVerification = {
  environment: string; // "production" | "preview" | "development" | "local"
  keyMode: "live" | "test" | "unset";
  liveKeyRequired: boolean;
  liveKeySatisfied: boolean;
  priceConfigured: boolean;
  priceResolved: boolean;
  livemodeMatchesKey: boolean | null;
  price: PriceEvaluation | null;
  errors: string[]; // safe, generic — no secrets/ids
  ok: boolean;
};

let cache: { at: number; result: BillingVerification } | null = null;
const TTL_MS = 60_000;

/** Retrieve + validate the configured price live. Cached 60s to prevent abuse. */
export async function verifyLiveBilling(force = false): Promise<BillingVerification> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.result;

  const mode = secretKeyMode();
  const errors: string[] = [];
  let priceResolved = false;
  let price: PriceEvaluation | null = null;
  let livemodeMatchesKey: boolean | null = null;

  if (requiresLiveKey() && mode === "test") errors.push("production is using a TEST secret key");
  if (!isStripeConfigured()) errors.push("no Stripe secret key configured");
  if (!proPriceId()) errors.push("STRIPE_PRICE_PRO_MONTHLY not configured");

  if (isStripeConfigured() && proPriceId()) {
    try {
      const stripe = getStripe();
      const p = await stripe.prices.retrieve(proPriceId()!, { expand: ["product"] });
      priceResolved = true;
      const prod = p.product;
      const productName =
        prod && typeof prod === "object" && "name" in prod ? ((prod.name as string | null) ?? null) : null;
      price = evaluatePrice(p, productName);
      livemodeMatchesKey = mode === "unset" ? null : (p.livemode === true) === (mode === "live");
      if (!price.allOk) errors.push("configured price does not match the expected Pro plan");
      if (livemodeMatchesKey === false) errors.push("price live-mode does not match the key mode");
    } catch {
      // A test key can't retrieve a live price (and vice-versa) → surfaces here.
      errors.push("could not retrieve the configured price (wrong mode or invalid id)");
    }
  }

  const result: BillingVerification = {
    environment: deployEnv() || "local",
    keyMode: mode,
    liveKeyRequired: requiresLiveKey(),
    liveKeySatisfied: liveKeySatisfied(),
    priceConfigured: Boolean(proPriceId()),
    priceResolved,
    livemodeMatchesKey,
    price,
    errors,
    ok: errors.length === 0 && liveKeySatisfied() && priceResolved && price?.allOk === true,
  };
  cache = { at: Date.now(), result };
  return result;
}
