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
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">QR codes that just work.</h1>
      <div className="mt-6 flex flex-col gap-4 text-muted-foreground leading-relaxed">
        <p>
          {site.name} is a simple, honest QR code generator. Pick from 16 types, design a code that
          still scans, and download it as PNG or SVG — free to start. Publish a hosted code and you
          get a real landing page plus privacy-safe scan analytics you can actually use.
        </p>
        <p>
          We&apos;re a small team that ships fast, and we price plainly: free for your first{" "}
          {site.pricing.freeQrLimit} codes, ${site.pricing.amount}/month for unlimited. No per-scan
          fees, no watermark, cancel anytime.
        </p>
      </div>
      <div className="mt-8">
        <HalfstackEndorser />
      </div>
    </div>
  );
}
