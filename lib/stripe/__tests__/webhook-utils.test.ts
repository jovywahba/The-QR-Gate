import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { iso, subPeriod } from "../webhook-utils";

describe("iso", () => {
  it("converts unix seconds to an ISO string", () => {
    expect(iso(0)).toBe("1970-01-01T00:00:00.000Z");
    expect(iso(1_700_000_000)).toBe(new Date(1_700_000_000_000).toISOString());
  });
  it("is null-safe", () => {
    expect(iso(null)).toBeNull();
    expect(iso(undefined)).toBeNull();
  });
});

describe("subPeriod (API-version robust)", () => {
  it("reads the subscription-level field (older API versions)", () => {
    const sub = { current_period_end: 1234, items: { data: [{}] } } as unknown as Stripe.Subscription;
    expect(subPeriod(sub, "current_period_end")).toBe(1234);
  });

  it("falls back to the subscription-item field (newer API versions)", () => {
    const sub = { items: { data: [{ current_period_end: 5678 }] } } as unknown as Stripe.Subscription;
    expect(subPeriod(sub, "current_period_end")).toBe(5678);
  });

  it("prefers the subscription-level value when both exist", () => {
    const sub = {
      current_period_start: 100,
      items: { data: [{ current_period_start: 999 }] },
    } as unknown as Stripe.Subscription;
    expect(subPeriod(sub, "current_period_start")).toBe(100);
  });

  it("returns null when neither is present", () => {
    expect(subPeriod({ items: { data: [{}] } } as unknown as Stripe.Subscription, "current_period_end")).toBeNull();
    expect(subPeriod({} as unknown as Stripe.Subscription, "current_period_start")).toBeNull();
  });
});
