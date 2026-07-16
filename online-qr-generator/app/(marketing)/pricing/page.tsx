import type { Metadata } from "next";
import { PricingCard } from "@/components/marketing/pricing-card";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { Faq } from "@/components/marketing/faq";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${site.name} pricing — half of ${site.incumbent.name}. ${site.pricing.trialDays}-day free trial.`,
};

export default function PricingPage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="font-mono text-xs uppercase tracking-wider text-accent">Pricing</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            One plan. Half the price.
          </h1>
          <p className="mt-3 text-muted-foreground">
            {site.incumbent.name} starts at {site.incumbent.priceLabel}. We don’t.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl items-start gap-5 md:grid-cols-[1fr_1.2fr]">
          <PricingCard />
          <ComparisonTable />
        </div>
      </div>

      <Faq />
    </>
  );
}
