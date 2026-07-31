import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isBillingConfigured, isRealValue, isStripeConfigured, proPriceId } from "../config";

const KEYS = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_PRO_MONTHLY"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("isRealValue", () => {
  it("rejects empty and placeholder values", () => {
    expect(isRealValue(undefined)).toBe(false);
    expect(isRealValue("")).toBe(false);
    expect(isRealValue("price_placeholder_123")).toBe(false);
    expect(isRealValue("sk_live_real")).toBe(true);
  });
});

describe("Stripe config predicates (env-driven)", () => {
  it("reports unconfigured when no secret key is set", () => {
    expect(isStripeConfigured()).toBe(false);
    expect(isBillingConfigured()).toBe(false);
    expect(proPriceId()).toBeUndefined();
  });

  it("secret key without a price → Stripe configured, but billing (checkout) is not", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    expect(isStripeConfigured()).toBe(true);
    expect(isBillingConfigured()).toBe(false);
  });

  it("key + price → billing configured; proPriceId returns ONLY the configured price", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_monthly_123";
    expect(isBillingConfigured()).toBe(true);
    expect(proPriceId()).toBe("price_pro_monthly_123");
  });

  it("a placeholder price counts as unconfigured (no accidental checkout)", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_placeholder";
    expect(proPriceId()).toBeUndefined();
    expect(isBillingConfigured()).toBe(false);
  });
});
