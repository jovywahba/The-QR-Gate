"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Shared form plumbing for the Step-2 content forms: labelled fields
 * with accessible inline errors, blur-touched tracking, and
 * focus-the-first-invalid-field on a failed Continue.
 */

export function fieldId(type: string, field: string): string {
  return `qr-${type}-${field}`;
}

/** Which errors are visible: touched fields always, everything after a failed Continue. */
export function useTouched(submitAttempt: number) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set());
  const touch = React.useCallback((field: string) => {
    setTouched((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));
  }, []);
  const showError = React.useCallback(
    (field: string, errors: Record<string, string>): string | undefined =>
      touched.has(field) || submitAttempt > 0 ? errors[field] : undefined,
    [touched, submitAttempt],
  );
  return { touch, showError };
}

/** After a failed Continue, focus the first invalid field (in visual order). */
export function useFocusFirstInvalid(
  submitAttempt: number,
  fieldOrder: readonly string[],
  fieldErrors: Record<string, string>,
  type: string,
) {
  const errorsRef = React.useRef(fieldErrors);
  errorsRef.current = fieldErrors;
  React.useEffect(() => {
    if (submitAttempt === 0) return;
    const first = fieldOrder.find((f) => f in errorsRef.current);
    if (first) document.getElementById(fieldId(type, first))?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitAttempt]);
}

/** Label + control + hint + accessible inline error. */
export function Field({
  id,
  label,
  required = false,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {!required && <span className="ml-1.5 font-mono text-[10px] text-muted-foreground uppercase">optional</span>}
      </Label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** aria props every control inside a <Field> should spread. */
export function fieldAria(id: string, error?: string, hasHint = false) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const;
}
