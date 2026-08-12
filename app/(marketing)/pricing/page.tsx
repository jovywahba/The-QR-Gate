import type { Metadata } from "next";
import { PricingCard } from "@/components/marketing/pricing-card";
import { Faq } from "@/components/marketing/faq";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${site.name} pricing — a free plan with ${site.pricing.freeQrLimit} QR codes, and Pro at $${site.pricing.amount}/mo for unlimited codes and scan analytics.`,
};

const FREE_INCLUDES = [
  `${site.pricing.freeQrLimit} active QR codes`,
  "All 16 QR types & full design controls",
  "PNG & SVG downloads",
  "Hosted & tracked codes",
];

export default function PricingPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-mono text-xs uppercase tracking-wider text-accent">Pricing</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">One simple plan.</h1>
          <p className="mt-3 text-muted-foreground">
            Start free with {site.pricing.freeQrLimit} QR codes — no credit card. Go unlimited on Pro
            for ${site.pricing.amount}/month. No per-scan fees, cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl items-stretch gap-5 md:grid-cols-2">
          {/* Free plan */}
          <div className="flex flex-col rounded-xl border bg-card p-6">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Free</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-semibold tracking-tight">$0</span>
              <span className="text-sm text-muted-foreground">/ forever</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Everything you need to make your first codes.</p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm">
              {FREE_INCLUDES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/sign-up"
              className="mt-auto inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Start free
            </a>
          </div>

          {/* Pro plan */}
          <PricingCard />
        </div>
      </div>

      <Faq />
    </>
  );
}
