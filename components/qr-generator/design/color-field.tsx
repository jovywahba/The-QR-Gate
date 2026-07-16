"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeHexColor } from "@/lib/qr/readability";

/**
 * Color control: native picker + hex text input with real validation.
 * Invalid text never silently mutates the QR — it shows an error and
 * leaves the last valid color in place.
 */
export function ColorField({
  id,
  label,
  value,
  defaultValue,
  onChange,
}: {
  id: string;
  label: string;
  /** Current valid hex color. */
  value: string;
  defaultValue: string;
  onChange: (hex: string) => void;
}) {
  const [text, setText] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);

  // External changes (presets, reset) refresh the text field.
  React.useEffect(() => {
    setText(value);
    setError(null);
  }, [value]);

  const commitText = (raw: string) => {
    setText(raw);
    const normalized = normalizeHexColor(raw);
    if (normalized) {
      setError(null);
      onChange(normalized);
    } else {
      setError("Enter a hex color like #1B1B2F.");
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalizeHexColor(value) ?? "#000000"}
          onChange={(e) => {
            setError(null);
            setText(e.target.value.toUpperCase());
            onChange(e.target.value.toUpperCase());
          }}
          aria-label={`${label} color picker`}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-background p-1"
        />
        <Input
          id={id}
          value={text}
          onChange={(e) => commitText(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          spellCheck={false}
          className="font-mono uppercase"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setText(defaultValue);
            setError(null);
            onChange(defaultValue);
          }}
          aria-label={`Reset ${label}`}
        >
          <RotateCcw />
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
