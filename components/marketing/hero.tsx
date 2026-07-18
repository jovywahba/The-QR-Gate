import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { site } from "@/lib/site";
import { landing } from "@/lib/landing";
import { formatPrice } from "@/lib/utils";

export function Hero() {
  const { amount, currency } = site.pricing;

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <div className="max-w-2xl">
          <div className="mb-5 font-mono text-xs uppercase tracking-wider text-accent">
            {site.halfstack.label}
          </div>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {site.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {site.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/sign-up">Start free</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/pricing">
                See pricing <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {landing.heroBullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4 text-accent" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-5 font-mono text-sm text-muted-foreground">
            Free plan · Pro <span className="text-foreground">{formatPrice(amount, currency)}</span>/mo · no card
            required
          </p>
        </div>

        {/* Product preview — a live mock of the app's main dashboard (see hero-preview). */}
        <div className="mt-16 overflow-hidden rounded-xl border bg-card shadow-[0_8px_24px_-8px_rgba(27,27,47,0.16)]">
          <div className="flex h-9 items-center gap-1.5 border-b bg-secondary px-4">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <div className="aspect-[16/10]">
            <HeroPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
