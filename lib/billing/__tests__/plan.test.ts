import { describe, expect, it } from "vitest";
import {
  FREE_ACTIVE_LIMIT,
  isProStatus,
  parsePlanStatus,
  quotaAllows,
  statusLabel,
} from "../plan";

describe("plan / quota logic", () => {
  it("only active + trialing count as unlimited Pro", () => {
    expect(isProStatus("active")).toBe(true);
    expect(isProStatus("trialing")).toBe(true);
    for (const s of ["past_due", "canceled", "unpaid", "incomplete", null, undefined, "free"]) {
      expect(isProStatus(s as string | null)).toBe(false);
    }
  });

  it("free quota allows creation only below the limit", () => {
    expect(quotaAllows(false, 0)).toBe(true);
    expect(quotaAllows(false, FREE_ACTIVE_LIMIT - 1)).toBe(true);
    expect(quotaAllows(false, FREE_ACTIVE_LIMIT)).toBe(false);
    expect(quotaAllows(false, FREE_ACTIVE_LIMIT + 5)).toBe(false);
  });

  it("Pro (unlimited) always allows creation regardless of count", () => {
    expect(quotaAllows(true, 0)).toBe(true);
    expect(quotaAllows(true, 999)).toBe(true);
  });

  it("parsePlanStatus normalizes the RPC jsonb", () => {
    const pro = parsePlanStatus({
      plan: "pro",
      status: "active",
      is_unlimited: true,
      active_count: 12,
      limit: null,
      can_create: true,
      current_period_end: "2026-08-01T00:00:00Z",
      cancel_at_period_end: false,
      price_id: "price_x",
    });
    expect(pro.plan).toBe("pro");
    expect(pro.isUnlimited).toBe(true);
    expect(pro.limit).toBeNull();
    expect(pro.canCreate).toBe(true);

    const free = parsePlanStatus({ plan: "free", is_unlimited: false, active_count: 3, limit: 3 });
    expect(free.plan).toBe("free");
    expect(free.limit).toBe(3);
    expect(free.canCreate).toBe(false); // 3 of 3
  });

  it("parsePlanStatus falls back to free on garbage", () => {
    expect(parsePlanStatus(null).plan).toBe("free");
    expect(parsePlanStatus(undefined).canCreate).toBe(true);
    expect(parsePlanStatus("nope").plan).toBe("free");
  });

  it("labels subscription statuses", () => {
    expect(statusLabel("active")).toBe("Active");
    expect(statusLabel("past_due")).toBe("Past due");
    expect(statusLabel(null)).toBe("Free");
  });
});
