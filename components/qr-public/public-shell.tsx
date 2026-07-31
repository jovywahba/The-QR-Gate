import Link from "next/link";
import { HalfstackEndorser } from "@/components/brand/logo";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * ───────────────────────────────────────────────────────────────
 * The ONE mobile-first shell every public scan destination shares:
 * the live /q/[slug] pages for all hosted types AND their states
 * (paused / scheduled / expired / not-found) AND the /design-preview
 * page. A single premium frame — warm page tint, a white rounded card
 * with a hairline + soft shadow, a restrained brand header, and a
 * safe-area-aware footer with the Halfstack endorser — so a scan of
 * any The QR Gate code feels like the same finished product.
 *
 * Design-system honest: ink type, rationed blue, border-led surfaces,
 * exactly one soft shadow on the card (elevation e1), generous spacing.
 * ───────────────────────────────────────────────────────────────
 */
export function PublicShell({
  children,
  variant = "card",
  className,
}: {
  children: React.ReactNode;
  /** "card" wraps content in the premium surface; "center" vertically centers a notice. */
  variant?: "card" | "center";
  className?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/50">
      <header className="mx-auto w-full max-w-md px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-1">
        <Link
          href="/"
          className="inline-flex items-center font-mono text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          {site.name}
        </Link>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-md flex-1 px-4 pt-2 pb-8",
          variant === "center" && "flex flex-col",
        )}
      >
        {variant === "card" ? (
          <div
            className={cn(
              "rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(27,27,47,0.05),0_10px_30px_-16px_rgba(27,27,47,0.18)] sm:p-5",
              className,
            )}
          >
            {children}
          </div>
        ) : (
          <div className={cn("flex flex-1 flex-col items-center justify-center text-center", className)}>
            {children}
          </div>
        )}
      </main>

      <footer className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-1.5 px-4 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Made with {site.name} — create your own QR code
          </Link>
          <HalfstackEndorser />
        </div>
      </footer>
    </div>
  );
}
