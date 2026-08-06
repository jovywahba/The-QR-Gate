import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  eventMatchesKeyMode,
  isBillingConfigured,
  isRealValue,
  isStripeConfigured,
  liveKeySatisfied,
  proPriceId,
  requiresLiveKey,
  secretKeyMode,
} from "../config";

const KEYS = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_PRO_MONTHLY", "VERCEL_ENV"] as const;
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

describe("secret-key mode (from prefix only — never the key)", () => {
  it("classifies live / test / unset", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_abc";
    expect(secretKeyMode()).toBe("live");
    process.env.STRIPE_SECRET_KEY = "rk_live_abc";
    expect(secretKeyMode()).toBe("live");
    process.env.STRIPE_SECRET_KEY = "sk_test_abc";
    expect(secretKeyMode()).toBe("test");
    process.env.STRIPE_SECRET_KEY = "whatever";
    expect(secretKeyMode()).toBe("unset");
    delete process.env.STRIPE_SECRET_KEY;
    expect(secretKeyMode()).toBe("unset");
  });
});

describe("production requires a LIVE key; preview/dev permit Sandbox", () => {
  it("PRODUCTION rejects a test secret key (checkout not configured)", () => {
    process.env.VERCEL_ENV = "production";
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_monthly_123";
    expect(requiresLiveKey()).toBe(true);
    expect(liveKeySatisfied()).toBe(false);
    expect(isBillingConfigured()).toBe(false);
  });

  it("PRODUCTION accepts a live secret key + price", () => {
    process.env.VERCEL_ENV = "production";
    process.env.STRIPE_SECRET_KEY = "sk_live_x";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_monthly_123";
    expect(liveKeySatisfied()).toBe(true);
    expect(isBillingConfigured()).toBe(true);
  });

  it("DEVELOPMENT permits a Sandbox/test key", () => {
    process.env.VERCEL_ENV = "development";
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_monthly_123";
    expect(requiresLiveKey()).toBe(false);
    expect(liveKeySatisfied()).toBe(true);
    expect(isBillingConfigured()).toBe(true);
  });

  it("PREVIEW permits a Sandbox/test key", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_monthly_123";
    expect(isBillingConfigured()).toBe(true);
  });
});

describe("live/sandbox webhook events cannot be mixed", () => {
  it("a live key processes only live events; a test key only test events", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_x";
    expect(eventMatchesKeyMode(true)).toBe(true);
    expect(eventMatchesKeyMode(false)).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    expect(eventMatchesKeyMode(false)).toBe(true);
    expect(eventMatchesKeyMode(true)).toBe(false);
  });
  it("unset key mode does not gate (endpoint is off anyway)", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(eventMatchesKeyMode(true)).toBe(true);
    expect(eventMatchesKeyMode(false)).toBe(true);
  });
});
