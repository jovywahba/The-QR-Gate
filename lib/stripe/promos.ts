/**
 * PURE promo-code helpers — validation + display formatting, no Stripe client
 * and no `server-only`, so they're unit-testable and shared by the admin page
 * (display) and the create action (validation). Stripe remains the source of
 * truth for the actual coupons + promotion codes.
 */

export type PromoDuration = "once" | "forever" | "repeating";

/** A validated, normalized promo ready to hand to the Stripe API. */
export type PromoInput = {
  code: string; // A–Z 0–9 _ - , 3–40, uppercased
  currency: string; // "usd"
  duration: PromoDuration;
  durationMonths?: number; // required for "repeating"
  percentOff?: number; // 1–100 (when discountType=percent)
  amountOffCents?: number; // > 0 (when discountType=amount)
  maxRedemptions?: number; // optional cap on total uses
  expiresAt?: number; // optional unix seconds (future)
};

/** Raw form values (strings) as they arrive from the client. */
export type RawPromo = {
  code?: string;
  discountType?: string; // "percent" | "amount"
  percentOff?: string | number;
  amountOffDollars?: string | number;
  duration?: string;
  durationMonths?: string | number;
  maxRedemptions?: string | number;
  expiresAt?: string; // yyyy-mm-dd or ""
  /** Injected in tests so expiry validation is deterministic. */
  nowSeconds?: number;
};

const CODE_RE = /^[A-Z0-9_-]{3,40}$/;

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export type PromoValidation = { ok: true; value: PromoInput } | { ok: false; error: string };

/** Validate + normalize a raw promo form into a Stripe-ready PromoInput. */
export function validatePromo(raw: RawPromo): PromoValidation {
  const code = normalizeCode(String(raw.code ?? ""));
  if (!CODE_RE.test(code)) {
    return { ok: false, error: "Code must be 3–40 characters: A–Z, 0–9, underscore or hyphen." };
  }

  const duration = raw.duration as PromoDuration;
  if (!["once", "forever", "repeating"].includes(duration)) {
    return { ok: false, error: "Choose a valid duration." };
  }

  let durationMonths: number | undefined;
  if (duration === "repeating") {
    durationMonths = Math.floor(Number(raw.durationMonths));
    if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 36) {
      return { ok: false, error: "A repeating discount needs 1–36 months." };
    }
  }

  const value: PromoInput = { code, currency: "usd", duration, durationMonths };

  if (raw.discountType === "percent") {
    const p = Number(raw.percentOff);
    if (!Number.isFinite(p) || p <= 0 || p > 100) {
      return { ok: false, error: "Percent off must be between 1 and 100." };
    }
    value.percentOff = Math.round(p * 100) / 100;
  } else if (raw.discountType === "amount") {
    const d = Number(raw.amountOffDollars);
    if (!Number.isFinite(d) || d <= 0) {
      return { ok: false, error: "Amount off must be greater than 0." };
    }
    value.amountOffCents = Math.round(d * 100);
    if (value.amountOffCents < 1) return { ok: false, error: "Amount off must be at least $0.01." };
  } else {
    return { ok: false, error: "Choose a discount type." };
  }

  if (raw.maxRedemptions !== undefined && String(raw.maxRedemptions).trim() !== "") {
    const m = Math.floor(Number(raw.maxRedemptions));
    if (!Number.isInteger(m) || m < 1) return { ok: false, error: "Max redemptions must be at least 1." };
    value.maxRedemptions = m;
  }

  if (raw.expiresAt && String(raw.expiresAt).trim() !== "") {
    const t = Date.parse(String(raw.expiresAt));
    if (Number.isNaN(t)) return { ok: false, error: "Invalid expiry date." };
    const secs = Math.floor(t / 1000);
    const now = raw.nowSeconds ?? Math.floor(Date.now() / 1000);
    if (secs <= now) return { ok: false, error: "Expiry must be in the future." };
    value.expiresAt = secs;
  }

  return { ok: true, value };
}

function money(cents: number, currency: string): string {
  const v = (cents / 100).toFixed(2);
  return currency.toLowerCase() === "usd" ? `$${v}` : `${v} ${currency.toUpperCase()}`;
}

/** Human label for a coupon's discount, e.g. "25% off · first payment". */
export function formatDiscount(c: {
  percentOff?: number | null;
  amountOff?: number | null; // cents
  currency?: string | null;
  duration?: string | null;
  durationMonths?: number | null;
}): string {
  const amt =
    c.percentOff != null
      ? `${c.percentOff}% off`
      : c.amountOff != null
        ? `${money(c.amountOff, c.currency ?? "usd")} off`
        : "discount";
  const dur =
    c.duration === "forever"
      ? "every payment"
      : c.duration === "once"
        ? "first payment"
        : c.duration === "repeating"
          ? `${c.durationMonths} month${c.durationMonths === 1 ? "" : "s"}`
          : "";
  return dur ? `${amt} · ${dur}` : amt;
}
