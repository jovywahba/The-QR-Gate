import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { landing } from "@/lib/landing";
import { cn, formatPrice } from "@/lib/utils";

// Shared by the landing pricing section and the /pricing page.
export function PricingCard({ className }: { className?: string }) {
  const { amount, currency, interval } = site.pricing;

  return (
    <div className={cn("rounded-xl border bg-card p-8", className)}>
      <div className="text-sm font-medium">{site.pricing.planName}</div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-mono text-4xl font-medium">{formatPrice(amount, currency)}</span>
        <span className="text-sm text-muted-foreground">/{interval === "month" ? "mo" : "yr"}</span>
      </div>
      <Button className="mt-6 w-full" size="lg" asChild>
        <Link href="/sign-up">Start free</Link>
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {site.pricing.freeQrLimit} free QR codes · no card required · cancel anytime
      </p>
      <ul className="mt-6 flex flex-col gap-3">
        {landing.planIncludes.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm">
            <Check className="size-4 text-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
