import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="border-t bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Make your first QR code — free.</h2>
          <p className="mt-1 text-sm text-primary-foreground/70">
            16 types, full design controls, PNG &amp; SVG downloads. No credit card to start.
          </p>
        </div>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/sign-up">Start free</Link>
        </Button>
      </div>
    </section>
  );
}
