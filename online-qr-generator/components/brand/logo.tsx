import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * App wordmark (placeholder). Each product ships its OWN logo — replace this
 * with the real mark when you have one. Keep it on-system: Geist 600, tight tracking.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-xl font-semibold tracking-tight">{site.name}</span>
    </Link>
  );
}

/**
 * The Halfstack mark — a four-bar stack on a 100 grid (full stack of
 * capabilities; the lower half outlined = the half you don't pay for).
 * Locked artwork: never stretch, recolor (outside ink/accent), rotate, or add
 * effects. Used only for the "A Halfstack product" endorser.
 */
export function HalfstackMark({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("text-foreground", className)}
      aria-hidden
    >
      <rect x="18" y="14" width="64" height="12" rx="6" fill="currentColor" />
      <rect x="18" y="34" width="64" height="12" rx="6" fill="currentColor" />
      <rect x="20" y="56" width="60" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="20" y="76" width="60" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

/** "A Halfstack product" endorser lockup for footers. */
export function HalfstackEndorser({ className }: { className?: string }) {
  return (
    <a
      href={site.halfstack.portfolioUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      <HalfstackMark size={13} />
      {site.halfstack.label}
    </a>
  );
}
