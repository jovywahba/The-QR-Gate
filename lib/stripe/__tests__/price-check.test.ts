import { describe, expect, it } from "vitest";
import { evaluatePrice, type PriceLike } from "../price-check";

const GOOD: PriceLike = {
  active: true,
  livemode: true,
  currency: "usd",
  unit_amount: 1000,
  recurring: { interval: "month" },
};
const NAME = "The QR Gate Pro";

describe("evaluatePrice — the production Pro plan must match exactly", () => {
  it("accepts the correct live price", () => {
    const r = evaluatePrice(GOOD, NAME);
    expect(r.allOk).toBe(true);
    expect(r.active && r.currencyUsd && r.amountCorrect && r.intervalMonthly && r.productNameMatch).toBe(true);
    expect(r.livemode).toBe(true);
  });

  it("rejects an INACTIVE price", () => {
    const r = evaluatePrice({ ...GOOD, active: false }, NAME);
    expect(r.active).toBe(false);
    expect(r.allOk).toBe(false);
  });

  it("rejects a WRONG currency", () => {
    const r = evaluatePrice({ ...GOOD, currency: "eur" }, NAME);
    expect(r.currencyUsd).toBe(false);
    expect(r.allOk).toBe(false);
  });

  it("rejects a WRONG amount", () => {
    const r = evaluatePrice({ ...GOOD, unit_amount: 2000 }, NAME);
    expect(r.amountCorrect).toBe(false);
    expect(r.allOk).toBe(false);
  });

  it("rejects a NON-MONTHLY interval", () => {
    const r = evaluatePrice({ ...GOOD, recurring: { interval: "year" } }, NAME);
    expect(r.intervalMonthly).toBe(false);
    expect(r.allOk).toBe(false);
  });

  it("rejects a one-time price (no recurring)", () => {
    const r = evaluatePrice({ ...GOOD, recurring: null }, NAME);
    expect(r.intervalMonthly).toBe(false);
    expect(r.allOk).toBe(false);
  });

  it("rejects a mismatched product name", () => {
    const r = evaluatePrice(GOOD, "Some Other Product");
    expect(r.productNameMatch).toBe(false);
    expect(r.allOk).toBe(false);
    expect(evaluatePrice(GOOD, null).productNameMatch).toBe(false);
  });

  it("reports live-mode separately (a valid Sandbox price is allOk but livemode=false)", () => {
    const r = evaluatePrice({ ...GOOD, livemode: false }, NAME);
    expect(r.allOk).toBe(true); // all properties correct
    expect(r.livemode).toBe(false); // the caller compares this to the key mode
  });
});
