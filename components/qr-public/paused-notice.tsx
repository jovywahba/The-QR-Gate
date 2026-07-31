import { PauseCircle } from "lucide-react";
import { PublicShell } from "./public-shell";

/**
 * The polished public page for a paused QR. The destination is withheld,
 * but the record, slug, and analytics are preserved — a paused code starts
 * resolving again the moment it's unpaused.
 */
export function PausedNotice() {
  return (
    <PublicShell variant="center" className="gap-4">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#D9A21B]/10 text-[#D9A21B]">
        <PauseCircle aria-hidden />
      </span>
      <h1 className="text-lg font-semibold">This QR code is paused</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        The owner has temporarily turned this destination off. Please check back later.
      </p>
    </PublicShell>
  );
}
