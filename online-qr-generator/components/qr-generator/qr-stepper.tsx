"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { WIZARD_STEPS, type WizardStep } from "@/lib/qr/types";
import { cn } from "@/lib/utils";
import { useQRWizard } from "./use-qr-wizard";

/**
 * The 4-part progress stepper. Completed steps are buttons (going
 * back never loses data); upcoming steps are inert. Blue marks the
 * active step only — everything else stays ink/muted.
 */

export function useMaxReachableStep(): WizardStep {
  const { state, validation } = useQRWizard();
  if (!state.selectedType) return 1;
  if (!validation.valid) return 2;
  return 4;
}

export function QRStepper({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { state, goToStep } = useQRWizard();
  const maxReachable = useMaxReachableStep();
  const active = WIZARD_STEPS.find((s) => s.step === state.step)!;

  if (compact) {
    return (
      <div className={cn("flex items-center justify-between gap-3", className)}>
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Step {state.step} of {WIZARD_STEPS.length}
        </p>
        <p className="truncate text-sm font-semibold">{active.name}</p>
        <div className="flex items-center gap-1.5" aria-hidden>
          {WIZARD_STEPS.map(({ step }) => (
            <span
              key={step}
              className={cn(
                "size-1.5 rounded-full",
                step === state.step ? "bg-accent" : step < state.step ? "bg-foreground" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center gap-1">
        {WIZARD_STEPS.map(({ step, name }, i) => {
          const isActive = step === state.step;
          const isCompleted = step < state.step;
          const isReachable = step <= maxReachable && !isActive;

          return (
            <li key={step} className="flex items-center">
              {i > 0 && <span aria-hidden className="mx-1 h-px w-4 bg-border lg:w-6" />}
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => goToStep(step)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                  isReachable && "hover:bg-muted",
                  !isReachable && !isActive && "cursor-default",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full font-mono text-[11px] font-medium",
                    isActive && "bg-accent text-accent-foreground",
                    isCompleted && "bg-foreground text-background",
                    !isActive && !isCompleted && "border text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="size-3" /> : step}
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap lg:inline",
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {name}
                </span>
                <span className="sr-only lg:hidden">{name}</span>
                {isCompleted && <span className="sr-only">(completed)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
