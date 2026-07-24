import Link from "next/link";
import { PauseCircle } from "lucide-react";
import { HalfstackEndorser } from "@/components/brand/logo";
import { site } from "@/lib/site";

/**
 * The polished public page for a paused QR. The destination is withheld,
 * but the record, slug, and analytics are preserved — a paused code starts
 * resolving again the moment it's unpaused.
 */
export function PausedNotice() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#D9A21B]/10 text-[#D9A21B]">
          <PauseCircle aria-hidden />
        </span>
        <h1 className="text-lg font-semibold">This QR code is paused</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          The owner has temporarily turned this destination off. Please check back later.
        </p>
      </main>
      <footer className="border-t bg-card py-4">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-1.5 px-4 text-center">
          <Link href="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Made with {site.name} — create your own QR code
          </Link>
          <HalfstackEndorser />
        </div>
      </footer>
    </div>
  );
}
