/**
 * ───────────────────────────────────────────────────────────────
 * THE per-app config. Editing this object reskins the whole
 * marketing site, pricing, footer, and metadata.
 *
 * The QR Gate is an original, Halfstack-owned brand — a QR code
 * generator sold as one simple plan (free tier + Pro). We do NOT run
 * a "half the price of <competitor>" comparison story: there is no
 * verified competitor price to anchor to, so the positioning is about
 * what the product does, not what it undercuts.
 * ───────────────────────────────────────────────────────────────
 */

/**
 * Canonical absolute origin, normalized from NEXT_PUBLIC_SITE_URL: trailing
 * slashes stripped, and a malformed value (empty, protocol-relative "//host",
 * or one carrying a path) falls back to the production domain — so we never
 * build broken URLs like "//www.theqrgate.com".
 */
function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  return /^https?:\/\/[a-z0-9.-]+(:\d{2,5})?$/i.test(raw) ? raw : "https://www.theqrgate.com";
}

export const site = {
  // ── Brand ────────────────────────────────────────────────────
  name: "The QR Gate",
  domain: "www.theqrgate.com",
  url: resolveSiteUrl(),
  tagline: "Create, customize, and share QR codes.",
  description:
    "Create QR codes for websites, WhatsApp, WiFi, contact cards, PDFs and more — pick a type, add your content, style it, and download as PNG or SVG. Free to start; go unlimited with Pro.",

  // ── Pricing ──────────────────────────────────────────────────
  //    Free: 3 active QR codes. Pro: unlimited + scan analytics.
  pricing: {
    amount: 10, // The QR Gate Pro — $10/mo
    currency: "usd",
    interval: "month" as "month" | "year",
    unit: "", // flat (not per-seat)
    trialDays: 0, // no trial — clean $10/mo
    planName: "The QR Gate Pro",
    freeQrLimit: 3,
  },

  // ── Halfstack endorser brand ─────────────────────────────────
  halfstack: {
    label: "A Halfstack product",
    portfolioUrl: "https://tryhalfstack.com",
  },

  // ── Footer / contact ─────────────────────────────────────────
  email: "info@tryhalfstack.com", // support inbox (shared)
  social: {
    x: "",
    github: "",
  },
} as const;

export type Site = typeof site;
