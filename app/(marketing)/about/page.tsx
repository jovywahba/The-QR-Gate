import type { Metadata } from "next";
import { HalfstackEndorser } from "@/components/brand/logo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${site.name} exists.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="font-mono text-xs uppercase tracking-wider text-accent">About</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Software shouldn’t cost a fortune.
      </h1>
      <div className="mt-6 flex flex-col gap-4 text-muted-foreground leading-relaxed">
        <p>
          {site.name} rebuilds the part of {site.incumbent.name} that most people actually use — and
          charges half the price. No gimmicks, no per-feature upsells.
        </p>
        <p>
          We’re a small team that ships fast. {/* TODO: your story */}
        </p>
      </div>
      <div className="mt-8">
        <HalfstackEndorser />
      </div>
    </div>
  );
}
