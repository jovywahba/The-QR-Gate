import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { HalfstackEndorser } from "@/components/brand/logo";
import { site } from "@/lib/site";

/**
 * Public page for a scheduled QR that isn't currently open — shown before
 * its start ("not available yet") or after its end ("ended"). If the owner
 * set a safe fallback URL, we offer it as a link (we never auto-redirect
 * from the hosted notice).
 */
export function ScheduleNotice({
  state,
  fallbackUrl,
}: {
  state: "scheduled" | "expired";
  fallbackUrl?: string | null;
}) {
  const safeFallback = fallbackUrl && /^https?:\/\//i.test(fallbackUrl) ? fallbackUrl : null;
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CalendarClock aria-hidden />
        </span>
        <h1 className="text-lg font-semibold">
          {state === "scheduled" ? "This QR experience isn’t available yet" : "This QR experience has ended"}
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          {state === "scheduled"
            ? "The owner has scheduled this to go live later. Please check back soon."
            : "The owner has ended this QR experience."}
        </p>
        {safeFallback ? (
          <a
            href={safeFallback}
            className="text-sm font-medium text-accent hover:underline"
            rel="noreferrer"
          >
            Continue anyway
          </a>
        ) : null}
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
