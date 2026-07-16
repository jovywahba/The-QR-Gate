"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Keyboard-first reorder controls for repeatable rows (links, socials,
 * images). Move up / Move down buttons are the accessible baseline —
 * no drag-only interactions.
 */

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function RowControls({
  index,
  count,
  itemLabel,
  onMove,
  onRemove,
  canRemove = true,
}: {
  index: number;
  count: number;
  itemLabel: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  canRemove?: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label={`Reorder or remove ${itemLabel}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        aria-label={`Move ${itemLabel} up`}
      >
        <ChevronUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        aria-label={`Move ${itemLabel} down`}
      >
        <ChevronDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canRemove}
        onClick={onRemove}
        aria-label={`Remove ${itemLabel}`}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
