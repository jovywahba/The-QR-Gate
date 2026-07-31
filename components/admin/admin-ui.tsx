import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared admin building blocks. Server components (no client state) so they
 * drop into any admin page. They keep the panel consistent and encode the
 * "no fake data" rule: unavailable → an honest notice, never a placeholder
 * number.
 */

/** Shown when a page's data needs migration 0006 (SUPABASE_ADMIN_COMPLETION.sql). */
export function MigrationRequired({
  what = "This data",
  file = "supabase/SUPABASE_ADMIN_COMPLETION.sql",
}: {
  what?: string;
  file?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-5 text-sm text-muted-foreground">
      <CircleAlert className="mt-0.5 size-4 flex-none text-[#D9A21B]" aria-hidden />
      <div>
        <p className="font-medium text-foreground">Code complete — migration required</p>
        <p className="mt-1">
          {what} becomes live once <span className="font-mono text-xs">{file}</span> (migration{" "}
          <span className="font-mono text-xs">0006</span>) is applied in the Supabase SQL Editor.
          Until then this page shows no data rather than a fabricated value.
        </p>
      </div>
    </div>
  );
}

/** A titled card section. */
export function AdminSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between gap-3 border-b p-5">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** A vertical bar trend from a daily series. Dependency-free, accessible. */
export function TrendBars({
  data,
  emptyLabel = "No activity in this range.",
}: {
  data: { day: string; count: number }[];
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <div>
      <div className="flex h-28 items-end gap-0.5" role="img" aria-label={`Daily trend, ${total} total`}>
        {data.map((d) => (
          <div
            key={d.day}
            className="flex-1 rounded-t-sm bg-accent/70 transition-colors hover:bg-accent"
            style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
            title={`${d.day}: ${d.count.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{data[0]?.day}</span>
        <span className="tabular-nums">{total.toLocaleString()} total</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}

/** A horizontal-bar top-N breakdown (countries/devices/browsers/…). */
export function Breakdown({
  data,
  emptyLabel = "No data yet.",
}: {
  data: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ul className="flex flex-col gap-2">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate">{d.label}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {d.count.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent/70" style={{ width: `${(d.count / max) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** An honest "signal not recorded" row for the Security Center / health. */
export function NotTrackedRow({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span>
        {label}
        {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Not tracked</span>
    </div>
  );
}

const HEALTH_STYLES: Record<string, string> = {
  operational: "bg-[#1B8A5B]/10 text-[#1B8A5B]",
  degraded: "bg-[#D9A21B]/10 text-[#D9A21B]",
  unavailable: "bg-destructive/10 text-destructive",
  not_configured: "bg-muted text-muted-foreground",
};

/** A health/status pill (operational/degraded/unavailable/not configured). */
export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        HEALTH_STYLES[status] ?? HEALTH_STYLES.not_configured,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? status.replace("_", " ")}
    </span>
  );
}
