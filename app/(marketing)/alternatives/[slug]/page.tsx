import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { site } from "@/lib/site";

// Programmatic SEO: one page per entry in site.alternatives — the
// "<Incumbent> alternative" play. Keep all claims truthful + sourced (CLAUDE.md §12).
export function generateStaticParams() {
  return site.alternatives.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const alt = site.alternatives.find((a) => a.slug === slug);
  if (!alt) return {};
  return {
    title: `${alt.competitor} alternative`,
    description: alt.subhead,
    alternates: { canonical: `${site.url}/alternatives/${alt.slug}` },
  };
}

export default async function AlternativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const alt = site.alternatives.find((a) => a.slug === slug);
  if (!alt) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-2xl">
        <div className="font-mono text-xs uppercase tracking-wider text-accent">
          {alt.competitor} alternative
        </div>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {alt.headline}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{alt.subhead}</p>
        <div className="mt-7 flex gap-3">
          <Button size="lg" asChild>
            <Link href="/sign-up">Start free</Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </div>

      <div className="mt-14">
        <ComparisonTable rows={alt.rows} incumbentName={alt.competitor} />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {alt.competitor} is a trademark of its respective owner. {site.name} is independent and not
        affiliated with, endorsed by, or sponsored by {alt.competitor}. Comparison reflects publicly
        listed pricing as of {site.incumbent.sourcedOn}.
      </p>
    </div>
  );
}
