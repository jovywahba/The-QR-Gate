/**
 * ───────────────────────────────────────────────────────────────
 * Landing-page CONTENT. Pair with lib/site.ts (identity + pricing +
 * comparison). Editing these two files reskins the whole marketing
 * site — you should rarely touch the section components themselves.
 *
 * Keep copy on-voice: confident, plain, anti-gimmick (docs/MARKETING.md).
 * ───────────────────────────────────────────────────────────────
 */
import {
  Wallet,
  ShieldCheck,
  Gauge,
  Plug,
  Lock,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { site } from "@/lib/site";

export type Feature = { icon: LucideIcon; title: string; body: string };
export type Step = { title: string; body: string };
export type Faq = { q: string; a: string };

export const landing = {
  // Hero
  heroBullets: ["No credit-card games", "Set up in minutes", "Cancel anytime"],

  // Social-proof strip (optional — leave blank to hide)
  socialProof: `For teams done overpaying for ${site.incumbent.name}.`,

  // What's in the plan (shown on the pricing card)
  planIncludes: [
    "Everything in the core product",
    "Unlimited projects",
    "SSO & audit logs included",
    "Email support",
  ],

  // Features — the core "80%" you rebuilt. 3 or 6 reads best.
  features: [
    {
      icon: Wallet,
      title: "Half the price",
      body: `Everything you actually use from ${site.incumbent.name}, billed at roughly half. No per-feature upsells.`,
    },
    {
      icon: Gauge,
      title: "Set up in minutes",
      body: "Self-serve from day one. No sales call, no onboarding fee, no implementation quarter.",
    },
    {
      icon: ShieldCheck,
      title: "Secure by default",
      body: "Row-level security, encrypted at rest, SSO and audit logs included — not a premium add-on.",
    },
    {
      icon: Plug,
      title: "Switch in an afternoon",
      body: `Import your data and keep moving. We built the workflow to feel familiar coming from ${site.incumbent.name}.`,
    },
    {
      icon: Lock,
      title: "Your data is yours",
      body: "Export anytime. No lock-in, no hostage pricing, no surprise tier you have to call to leave.",
    },
    {
      icon: LineChart,
      title: "Honest, flat pricing",
      body: "One plan, one number. The price on the page is the price you pay.",
    },
  ] satisfies Feature[],

  // How it works — 3 steps.
  steps: [
    { title: "Sign up free", body: `Start a ${site.pricing.trialDays}-day trial. No commitment.` },
    { title: "Bring your data", body: `Import from ${site.incumbent.name} or start fresh.` },
    { title: "Pay half", body: "Keep everything you need. Drop the bill by half." },
  ] satisfies Step[],

  // FAQ — also earns long-tail search + handles objections.
  faqs: [
    {
      q: `How can you be half of ${site.incumbent.name}'s price?`,
      a: "We rebuilt the features most people actually use and run lean — no enterprise sales team, no bloat. The savings go to you.",
    },
    {
      q: "Is it as secure?",
      a: "Yes. Row-level security on every table, encryption at rest, and SSO + audit logs included on every plan.",
    },
    {
      q: `Can I migrate from ${site.incumbent.name}?`,
      a: "Yes — import your existing data and keep working. Most teams switch in an afternoon.",
    },
    {
      q: "Is there a free trial?",
      a: `Yes — ${site.pricing.trialDays} days. A card is required to start, and you can cancel anytime before it ends.`,
    },
    {
      q: "What's the catch?",
      a: "None. One honest price, cancel anytime, export your data whenever you want.",
    },
    {
      q: "Do you offer support?",
      a: `Email support is included. Reach us anytime at ${site.email}.`,
    },
  ] satisfies Faq[],
};
