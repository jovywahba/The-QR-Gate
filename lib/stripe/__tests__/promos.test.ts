import { describe, expect, it } from "vitest";
import { formatDiscount, normalizeCode, validatePromo, type RawPromo } from "../promos";

const base: RawPromo = { code: "summer25", discountType: "percent", percentOff: "25", duration: "once" };

describe("validatePromo", () => {
  it("accepts a valid percent promo and normalizes the code", () => {
    const r = validatePromo(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.code).toBe("SUMMER25");
      expect(r.value.percentOff).toBe(25);
      expect(r.value.currency).toBe("usd");
      expect(r.value.duration).toBe("once");
    }
  });

  it("converts a dollar amount to integer cents", () => {
    const r = validatePromo({ code: "SAVE5", discountType: "amount", amountOffDollars: "5", duration: "forever" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.amountOffCents).toBe(500);
      expect(r.value.percentOff).toBeUndefined();
    }
  });

  it("rejects bad codes", () => {
    for (const code of ["", "ab", "has space", "toolong".repeat(10)]) {
      expect(validatePromo({ ...base, code }).ok).toBe(false);
    }
  });

  it("rejects a percent outside 1–100", () => {
    expect(validatePromo({ ...base, percentOff: "0" }).ok).toBe(false);
    expect(validatePromo({ ...base, percentOff: "150" }).ok).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(validatePromo({ code: "X1", discountType: "amount", amountOffDollars: "0", duration: "once" }).ok).toBe(false);
  });

  it("requires 1–36 months for a repeating discount", () => {
    expect(validatePromo({ ...base, duration: "repeating" }).ok).toBe(false);
    expect(validatePromo({ ...base, duration: "repeating", durationMonths: "3" }).ok).toBe(true);
    expect(validatePromo({ ...base, duration: "repeating", durationMonths: "99" }).ok).toBe(false);
  });

  it("validates optional max redemptions", () => {
    expect(validatePromo({ ...base, maxRedemptions: "0" }).ok).toBe(false);
    const r = validatePromo({ ...base, maxRedemptions: "100" });
    expect(r.ok && r.value.maxRedemptions).toBe(100);
  });

  it("requires a future expiry when set", () => {
    const now = 1_700_000_000; // fixed
    expect(validatePromo({ ...base, expiresAt: "2020-01-01", nowSeconds: now }).ok).toBe(false);
    const r = validatePromo({ ...base, expiresAt: "2099-01-01", nowSeconds: now });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.expiresAt).toBeGreaterThan(now);
  });

  it("requires a discount type", () => {
    expect(validatePromo({ code: "NOTYPE1", duration: "once" }).ok).toBe(false);
  });
});

describe("normalizeCode / formatDiscount", () => {
  it("uppercases + trims codes", () => {
    expect(normalizeCode("  black-friday ")).toBe("BLACK-FRIDAY");
  });

  it("formats percent + amount with duration", () => {
    expect(formatDiscount({ percentOff: 25, duration: "once" })).toBe("25% off · first payment");
    expect(formatDiscount({ amountOff: 500, currency: "usd", duration: "forever" })).toBe("$5.00 off · every payment");
    expect(formatDiscount({ percentOff: 10, duration: "repeating", durationMonths: 3 })).toBe("10% off · 3 months");
    expect(formatDiscount({ amountOff: 250, currency: "eur", duration: "repeating", durationMonths: 1 })).toBe("2.50 EUR off · 1 month");
  });
});
