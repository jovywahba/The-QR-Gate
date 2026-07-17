"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { QRTypeDefinition } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

/**
 * One selectable QR type. A real <button> — keyboard + screen-reader
 * accessible by construction. Selected state is the one place the
 * accent blue is allowed here.
 */
export function QRTypeCard({
  definition,
  selected,
  onSelect,
  onPreview,
  onPreviewEnd,
}: {
  definition: QRTypeDefinition;
  selected: boolean;
  onSelect: () => void;
  /** Fires on hover/focus — drives the right-side sample preview. */
  onPreview?: () => void;
  /** Fires on mouse-leave/blur — restores the previous preview. */
  onPreviewEnd?: () => void;
}) {
  const Icon = definition.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onPreview}
      onMouseLeave={onPreviewEnd}
      onFocus={onPreview}
      onBlur={onPreviewEnd}
      aria-pressed={selected}
      aria-label={`${definition.name} — ${definition.description}`}
      className={cn(
        "group relative flex h-full flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-colors",
        "hover:bg-secondary",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        selected && "border-accent ring-1 ring-accent",
      )}
    >
      <span className="flex w-full items-start justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-md border bg-background text-foreground transition-colors",
            selected && "border-accent text-accent",
          )}
          aria-hidden
        >
          <Icon className="size-4.5" />
        </span>
        {selected && (
          <span
            aria-hidden
            className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <Check className="size-3" />
          </span>
        )}
      </span>
      <span className="text-sm font-semibold">{definition.name}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{definition.description}</span>
    </button>
  );
}
