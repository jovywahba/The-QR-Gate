import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/qr-public/public-shell";
import { site } from "@/lib/site";

/**
 * The honest target of the Step-3 DESIGN-PREVIEW payload.
 *
 * While designing a hosted QR (PDF, gallery, business card, …) the editor
 * shows a real, scannable QR so every style choice is visible before the
 * final link exists. That preview QR encodes THIS page — an owned, real
 * URL, never localhost and never a guessed /q/[slug]. If someone scans a
 * design-preview code, they land here and learn exactly what it is, rather
 * than hitting a dead or fake link. The preview is never downloadable; the
 * moment the owner publishes, their code encodes its real destination.
 */

export const metadata: Metadata = {
  title: `QR design preview — ${site.name}`,
  description:
    "This QR code was scanned from a design preview. Its owner is still styling it — the final destination is assigned when they publish.",
  robots: { index: false },
};

export default function DesignPreviewPage() {
  return (
    <PublicShell className="space-y-5 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="relative flex size-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <QrCode className="size-8" aria-hidden />
          <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.14em] text-accent uppercase">
          Design preview
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">This QR is still being designed</h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
          You scanned a <span className="font-medium text-foreground">design preview</span> from{" "}
          {site.name}. Its owner is styling the code right now — the real destination is assigned the
          moment they publish. Try scanning again once it&apos;s live.
        </p>
      </div>

      <div className="space-y-2 pt-1">
        <Link
          href="/"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <QrCode className="size-4" aria-hidden />
          Create your own QR code
        </Link>
        <p className="text-xs text-muted-foreground">Free to start — no credit card to make your first codes.</p>
      </div>
    </PublicShell>
  );
}
