"use client";

import * as React from "react";
import { BatteryFull, Signal, Star, Wifi, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ───────────────────────────────────────────────────────────────
 * Mobile-preview kit — a realistic phone shell plus the primitives
 * every destination screen composes from. Shared so all 16 screens
 * read as one system. Preview-only: nothing here touches wizard
 * state, drafts, or published data.
 * ───────────────────────────────────────────────────────────────
 */

/** Fixed inner screen height — the phone scrolls internally past this.
 *  Tuned to a real iPhone ~19.5:9 aspect ratio for the tall silhouette. */
export const SCREEN_HEIGHT = 564;

/** Live "current-looking" status-bar clock. Starts at Apple's 9:41 so
 *  server + client first paint match (no hydration mismatch), then swaps
 *  to the real local time on mount and ticks each minute. */
function useStatusClock(): string {
  const [label, setLabel] = React.useState("9:41");
  React.useEffect(() => {
    const fmt = () =>
      new Date()
        .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        .replace(/\s*[AaPp][Mm]$/, "");
    setLabel(fmt());
    const id = setInterval(() => setLabel(fmt()), 20_000);
    return () => clearInterval(id);
  }, []);
  return label;
}

/** The iOS status bar: current-looking time + cellular / Wi-Fi / battery. */
function StatusBar() {
  const clock = useStatusClock();
  return (
    <div
      data-status-bar
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-between bg-background/55 px-5 pt-1.5 backdrop-blur-md"
    >
      <span className="font-mono text-[12px] font-semibold tracking-tight text-foreground tabular-nums">
        {clock}
      </span>
      <span className="flex items-center gap-1 text-foreground" aria-hidden>
        <Signal className="size-3.5" />
        <Wifi className="size-3.5" />
        <BatteryFull className="size-4" />
      </span>
    </div>
  );
}

/**
 * The one reusable iPhone shell — titanium rail, side buttons, Dynamic
 * Island, live iOS status bar, and a bottom home indicator. Used EVERYWHERE
 * a mobile preview is shown so Step-1 and Step-2+ read as the same device.
 *
 * Two content modes:
 *  - `children` → a live destination screen rendered into a fixed-height
 *    screen that scrolls internally (long content scrolls naturally).
 *  - `image` → a full-screen sample screenshot. The screen height follows
 *    the artwork's own aspect ratio, so it fills edge-to-edge with NO crop
 *    and NO empty band; the status bar sits over the artwork's clean top.
 */
export function IPhoneFrame({
  children,
  image,
  imageAlt = "",
  className,
}: {
  children?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  className?: string;
}) {
  return (
    <div data-iphone-frame className={cn("relative mx-auto w-full max-w-[276px]", className)}>
      {/* Side buttons (titanium rails) — the iPhone silhouette. */}
      <span aria-hidden className="absolute top-[92px] -left-[2px] h-7 w-[3px] rounded-l-sm bg-foreground/55" />
      <span aria-hidden className="absolute top-[136px] -left-[2px] h-12 w-[3px] rounded-l-sm bg-foreground/55" />
      <span aria-hidden className="absolute top-[196px] -left-[2px] h-12 w-[3px] rounded-l-sm bg-foreground/55" />
      <span aria-hidden className="absolute top-[164px] -right-[2px] h-16 w-[3px] rounded-r-sm bg-foreground/55" />

      {/* Titanium frame. */}
      <div className="relative rounded-[3rem] bg-gradient-to-b from-foreground/95 via-foreground to-foreground/95 p-[7px] shadow-[0_28px_60px_-24px_rgba(0,0,0,0.5)] ring-1 ring-foreground/20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-background ring-1 ring-black/10">
          <StatusBar />
          {/* Dynamic island. */}
          <div
            aria-hidden
            data-dynamic-island
            className="absolute top-[9px] left-1/2 z-30 h-[24px] w-[86px] -translate-x-1/2 rounded-full bg-foreground shadow-inner"
          />
          {image ? (
            // Sample artwork: full width, natural aspect → no crop, no band.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={imageAlt} className="block w-full select-none" draggable={false} />
          ) : (
            /* Live screen — internal scroll, scrollbar hidden. */
            <div
              className="overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ height: SCREEN_HEIGHT }}
            >
              {children}
            </div>
          )}
          {/* Home indicator with a soft scrim so it stays legible. */}
          <div
            data-home-indicator
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-background/90 to-transparent pt-6 pb-2.5"
          >
            <span aria-hidden className="h-1 w-24 rounded-full bg-foreground/45" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Back-compat alias — existing call sites import `PhoneFrame`. */
export const PhoneFrame = IPhoneFrame;

/* ── Layout primitives ── */

/** Standard padded content region. `top` clears the status bar when
 *  the screen has no full-bleed hero above it. */
export function Body({
  children,
  top = false,
  className,
}: {
  children: React.ReactNode;
  top?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 px-4 pb-10", top ? "pt-11" : "pt-3", className)}>{children}</div>
  );
}

/** Full-bleed hero image (or gradient) with a bottom-anchored slot. */
export function Hero({
  src,
  className,
  height = "h-40",
  scrim = true,
  children,
}: {
  src?: string | null;
  className?: string;
  height?: string;
  scrim?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative w-full overflow-hidden", height, className)}>
      {src ? (
        // Local data-URI / signed preview images — plain <img> on purpose.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/80 to-primary" />
      )}
      {scrim && (
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
      )}
      {children && <div className="absolute inset-x-0 bottom-0 p-3.5">{children}</div>}
    </div>
  );
}

/* ── Buttons ── */

export function PrimaryBtn({
  children,
  icon: Icon,
  tone = "ink",
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "ink" | "accent";
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold",
        tone === "accent" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
      )}
    >
      {Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </div>
  );
}

export function GhostBtn({ children, icon: Icon }: { children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium">
      {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      {children}
    </div>
  );
}

/** Small round icon action (call / email / directions rows). */
export function IconAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <span className="flex size-11 items-center justify-center rounded-full border bg-card">
        <Icon className="size-4.5 text-foreground" aria-hidden />
      </span>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

/* ── Content bits ── */

export function Avatar({
  src,
  name,
  size = 56,
  className,
}: {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}) {
  const initials =
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "•";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-full border-2 border-background object-cover shadow-sm", className)}
    />
  ) : (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary font-mono text-sm font-semibold text-primary-foreground shadow-sm",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("size-3", i < Math.round(value) ? "fill-[#D9A21B] text-[#D9A21B]" : "text-border")}
          />
        ))}
      </span>
      <span className="font-mono text-[11px] font-medium">{value.toFixed(1)}</span>
    </span>
  );
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
        <p className="truncate text-xs font-medium">{value}</p>
      </div>
    </div>
  );
}

export function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "open" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tone === "open" ? "bg-[#1B8A5B]/12 text-[#1B8A5B]" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 font-mono text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}
