"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Collapsible editor section — native <details>/<summary> (keyboard +
 * screen-reader support for free, no new UI primitive). Keeps the
 * mobile editor from becoming one endless form.
 */
export function DesignSection({
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  title: string;
  /** Small mono summary of the current value(s), shown in the header. */
  meta?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border bg-card open:pb-4"
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 select-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className="flex min-w-0 items-center gap-2">
          {meta && <span className="truncate font-mono text-[11px] text-muted-foreground">{meta}</span>}
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </span>
      </summary>
      <div className="space-y-4 px-4 pt-1">{children}</div>
    </details>
  );
}
