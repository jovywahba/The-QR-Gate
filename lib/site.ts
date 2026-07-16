/**
 * ───────────────────────────────────────────────────────────────
 * THE per-app config. Editing this object reskins the whole
 * marketing site, pricing, comparison/alternative pages, footer,
 * and metadata. Start every new app here.
 *
 * Rules (see /CLAUDE.md §11–§12):
 *  - `name` is an ORIGINAL, Halfstack-owned brand. The incumbent name is
 *    only used factually in comparisons.
 *  - Price ≈ 1/2 of the incumbent, rounded clean.
 *  - Comparison claims must be truthful + sourced + dated.
 * ───────────────────────────────────────────────────────────────
 */

export type ComparisonRow = {
  label: string;
  incumbent: string; // e.g. "$120" or "+$40/seat" or "Add-on"
  halfstack: string; // e.g. "$60" or "Included"
  /** short savings pill, e.g. "½", "−50%", "$0" */
  save?: string;
};

export type Alternative = {
  /** url slug: /alternatives/<slug> */
  slug: string;
  /** the incumbent this page targets (factual, nominative use only) */
  competitor: string;
  /** <title> + H1 driver, e.g. "The {competitor} alternative at half the price" */
  headline: string;
  subhead: string;
  rows: ComparisonRow[];
};

export const site = {
  // ── Brand ────────────────────────────────────────────────────
  name: "The QR Gate",
  domain: "example.com", // TODO: domain not chosen yet
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  tagline: "Create, customize, and share QR codes.",
  description:
    "Create QR codes for websites, WhatsApp, WiFi, contact cards and more — pick a type, add your content, style it, download. Half the price of the big QR platforms.",

  // ── The incumbent we model (factual comparison only) ─────────
  incumbent: {
    name: "QR Code Generator PRO", // Bitly's qr-code-generator.com
    url: "https://www.qr-code-generator.com",
    priceLabel: "TODO — verify before any public claim", // TODO: their headline price
    source: "https://www.qr-code-generator.com/pricing/", // TODO: verify
    sourcedOn: "", // TODO: YYYY-MM-DD when verified
  },

  // ── Our pricing (≈ 1/2, rounded clean) ───────────────────────
  pricing: {
    amount: 60, // TODO
    currency: "usd",
    interval: "month" as "month" | "year",
    unit: "seat", // "seat" | "user" | "" (flat)
    trialDays: 7,
  },

  // ── Halfstack endorser brand ─────────────────────────────────
  halfstack: {
    label: "A Halfstack product",
    portfolioUrl: "https://tryhalfstack.com", // the Halfstack home — every product links back here (keep)
  },

  // ── Footer / contact ─────────────────────────────────────────
  email: "info@tryhalfstack.com", // SUPPORT INBOX — all tools route here for now (shared; keep). See docs/ENGINEERING.md
  social: {
    x: "", // optional
    github: "",
  },

  // ── Headline comparison (shown on landing + /pricing) ────────
  comparison: {
    rows: [
      { label: "Per seat / month", incumbent: "$120", halfstack: "$60", save: "½" },
      { label: "25 seats / year", incumbent: "$36,000", halfstack: "$18,000", save: "−50%" },
      { label: "SSO & audit logs", incumbent: "+$40 / seat", halfstack: "Included", save: "$0" },
    ] satisfies ComparisonRow[],
  },

  // ── Programmatic "<Incumbent> alternative" pages ─────────────
  //    Each becomes /alternatives/<slug>. Keep claims truthful + sourced.
  alternatives: [
    {
      slug: "incumbent",
      competitor: "Incumbent",
      headline: "The Incumbent alternative at half the price",
      subhead: "Same core workflow, half the bill. Switch in an afternoon.",
      rows: [
        { label: "Per seat / month", incumbent: "$120", halfstack: "$60", save: "½" },
        { label: "SSO & audit logs", incumbent: "+$40 / seat", halfstack: "Included", save: "$0" },
        { label: "Setup time", incumbent: "Sales call", halfstack: "Self-serve", save: "" },
      ],
    },
  ] satisfies Alternative[],
} as const;

export type Site = typeof site;
