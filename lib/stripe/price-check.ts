/**
 * PURE Stripe price validation — no `server-only`, no Stripe client, so it is
 * unit-testable and safe to import anywhere. The live retrieval that feeds it
 * lives in ./verify (server-only). The expected Pro plan is the single source
 * of truth for what a valid production price must be.
 */

export const EXPECTED_PRICE = {
  currency: "usd",
  unitAmount: 1000, // $10.00
  interval: "month" as const,
  productName: "The QR Gate Pro",
};

export type PriceEvaluation = {
  active: boolean;
  livemode: boolean;
  currencyUsd: boolean;
  amountCorrect: boolean; // unit_amount === 1000
  intervalMonthly: boolean;
  productNameMatch: boolean;
  /** Every non-mode property is correct (livemode is judged separately by env). */
  allOk: boolean;
};

export type PriceLike = {
  active?: boolean;
  livemode?: boolean;
  currency?: string;
  unit_amount?: number | null;
  recurring?: { interval?: string | null } | null;
};

/** Evaluate a retrieved price + its product name against the Pro plan. */
export function evaluatePrice(price: PriceLike, productName: string | null): PriceEvaluation {
  const active = price.active === true;
  const livemode = price.livemode === true;
  const currencyUsd = (price.currency ?? "").toLowerCase() === EXPECTED_PRICE.currency;
  const amountCorrect = price.unit_amount === EXPECTED_PRICE.unitAmount;
  const intervalMonthly = price.recurring?.interval === EXPECTED_PRICE.interval;
  const productNameMatch = (productName ?? "") === EXPECTED_PRICE.productName;
  return {
    active,
    livemode,
    currencyUsd,
    amountCorrect,
    intervalMonthly,
    productNameMatch,
    allOk: active && currencyUsd && amountCorrect && intervalMonthly && productNameMatch,
  };
}
