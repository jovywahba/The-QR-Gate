/**
 * ───────────────────────────────────────────────────────────────
 * Landing-page CONTENT. Pair with lib/site.ts (identity + pricing).
 * Editing these two files reskins the whole marketing site.
 *
 * Voice: confident, plain, anti-gimmick. Describe what the product does —
 * no competitor-comparison or "half the price" framing.
 * ───────────────────────────────────────────────────────────────
 */
import {
  Download,
  LayoutGrid,
  LineChart,
  Palette,
  RefreshCw,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { site } from "@/lib/site";

export type Feature = { icon: LucideIcon; title: string; body: string };
export type Step = { title: string; body: string };
export type Faq = { q: string; a: string };

export const landing = {
  // Hero
  heroBullets: ["Free to start — 3 codes", "16 QR types", "PNG & SVG downloads"],

  // Social-proof strip — blank hides it (we don't fabricate testimonials).
  socialProof: "",

  // What's in the plan (shown on the pricing card — The QR Gate Pro)
  planIncludes: [
    "Unlimited QR codes",
    "Scan analytics",
    "16 QR types & full customization",
    "PNG & SVG downloads",
    "Email support",
  ],

  // Features — the core capabilities.
  features: [
    {
      icon: LayoutGrid,
      title: "16 QR types",
      body: "Websites, WiFi, vCards, PDFs, menus, social profiles, coupons and more — one builder for every kind of QR code.",
    },
    {
      icon: Palette,
      title: "Design that still scans",
      body: "Colors, gradients, dot & corner styles, a center logo and framed calls-to-action — with a live scan-safety check.",
    },
    {
      icon: RefreshCw,
      title: "Dynamic & editable",
      body: "Hosted QR codes get a real landing page — edit the destination anytime without reprinting the code.",
    },
    {
      icon: LineChart,
      title: "Real scan analytics",
      body: "Scans over time, unique visitors, devices and countries — privacy-safe, and no per-scan fees.",
    },
    {
      icon: Download,
      title: "PNG & SVG downloads",
      body: "Export at 512 / 1024 / 2048 px or as crisp vector SVG — print-ready, no watermark.",
    },
    {
      icon: Wallet,
      title: "Honest, flat pricing",
      body: `Start free with ${site.pricing.freeQrLimit} codes. Go unlimited on Pro for $${site.pricing.amount}/mo. The price on the page is the price you pay.`,
    },
  ] satisfies Feature[],

  // How it works — 3 steps.
  steps: [
    { title: "Pick a type", body: "Choose from 16 QR types — website, WiFi, vCard, PDF, menu and more." },
    { title: "Add content & design", body: "Fill in your details, then style the code and check it still scans." },
    { title: "Download or publish", body: `Export PNG/SVG free, or publish a hosted, trackable code. Go unlimited on Pro for $${site.pricing.amount}/mo.` },
  ] satisfies Step[],

  // FAQ — handles objections + earns long-tail search.
  faqs: [
    {
      q: "What's a dynamic (hosted) QR code?",
      a: `A hosted QR points at a page we host at ${site.domain}/q/… , so you can edit the destination or see scan analytics without changing the printed code. Direct types (like WiFi or a plain URL) encode the value itself.`,
    },
    {
      q: "Do the codes expire or have scan limits?",
      a: `No — your codes don't expire and there are no per-scan fees. Free accounts keep up to ${site.pricing.freeQrLimit} active codes; Pro is unlimited.`,
    },
    {
      q: "Is there a free plan?",
      a: `Yes — every account gets ${site.pricing.freeQrLimit} free QR codes, no card required. Upgrade to Pro ($${site.pricing.amount}/mo) for unlimited codes and scan analytics.`,
    },
    {
      q: "Can I customize how the QR looks?",
      a: "Yes — colors, gradients, dot and corner styles, a center logo, frames and a call-to-action, with a live readability check so it still scans.",
    },
    {
      q: "What formats can I download?",
      a: "PNG at 512, 1024 or 2048 px, and true vector SVG. No watermark on either.",
    },
    {
      q: "Do you offer support?",
      a: `Email support is included. Reach us anytime at ${site.email}.`,
    },
  ] satisfies Faq[],
};
