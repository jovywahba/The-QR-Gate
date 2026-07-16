"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/**
 * A labelled radio group rendered as selectable cards — real radios
 * underneath (arrow-key navigation, focus rings, accessible names).
 */
export function StyleOptionGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  columns = 3,
}: {
  legend: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as T)}
        className={cn("grid gap-2", columns === 3 ? "grid-cols-2 min-[420px]:grid-cols-3" : "grid-cols-2")}
      >
        {options.map((option) => (
          <Label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm transition-colors",
              "hover:bg-secondary has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-accent",
            )}
          >
            <RadioGroupItem value={option.value} />
            <span className="truncate">{option.label}</span>
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

/** Range input with a mono value readout — native, keyboard-accessible. */
export function RangeField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--accent)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
