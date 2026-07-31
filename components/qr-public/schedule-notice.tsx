import { CalendarClock } from "lucide-react";
import { PublicShell } from "./public-shell";

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
    <PublicShell variant="center" className="gap-4">
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
        <a href={safeFallback} className="text-sm font-medium text-accent hover:underline" rel="noreferrer">
          Continue anyway
        </a>
      ) : null}
    </PublicShell>
  );
}
