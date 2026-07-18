"use client";

import * as React from "react";

/**
 * Lightweight, dependency-free analytics charts (divs + CSS). Every
 * value shown is a real count passed in from the owner-scoped summary
 * RPC — nothing is synthesized here.
 */

export type Point = { date: string; count: number };
export type Slice = { key: string; count: number };

/** Daily scans bar chart for the selected window. */
export function DailyBars({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  const step = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <div
        className="flex h-40 min-w-full items-end gap-px"
        role="img"
        aria-label={`${total} scans over ${data.length} days`}
      >
        {data.map((d) => (
          <div key={d.date} className="group relative flex h-full min-w-[3px] flex-1 items-end">
            <div
              className="w-full rounded-t-sm bg-accent/80 transition-colors group-hover:bg-accent"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "2px" : "0" }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background group-hover:block">
              {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className="flex min-w-full justify-between font-mono text-[10px] text-muted-foreground">
        {data
          .filter((_, i) => i % step === 0)
          .map((d) => (
            <span key={d.date}>{d.date.slice(5)}</span>
          ))}
      </div>
    </div>
  );
}

/** Horizontal breakdown bars for one dimension. */
export function Breakdown({ title, data }: { title: string; data: Slice[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          data.map((d) => (
            <div key={d.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate">{d.key}</span>
                <span className="ml-2 shrink-0 font-mono tabular-nums text-muted-foreground">{d.count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground/70" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
