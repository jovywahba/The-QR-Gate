"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useQRWizard } from "./use-qr-wizard";

/**
 * Per-step navigation. Continue stays enabled while invalid so a
 * click can surface errors + focus the first invalid field (a11y —
 * silently disabled buttons explain nothing); it only advances once
 * the content validates.
 */

function StartOverButton({ label = "Start over" }: { label?: string }) {
  const { startOver, isDirty } = useQRWizard();

  if (!isDirty) {
    return (
      <Button type="button" variant="ghost" onClick={startOver}>
        <RotateCcw aria-hidden />
        {label}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost">
          <RotateCcw aria-hidden />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start over?</AlertDialogTitle>
          <AlertDialogDescription>
            This clears everything you&apos;ve entered for this QR code. There&apos;s no undo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction onClick={startOver}>Start over</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function WizardActions() {
  const { state, validation, goToStep, continueFrom } = useQRWizard();

  if (state.step === 1) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Select a QR type to continue.
      </p>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
      {state.step === 2 && (
        <>
          <Button type="button" variant="outline" onClick={() => goToStep(1)}>
            <ArrowLeft aria-hidden />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <StartOverButton />
            <Button
              type="button"
              onClick={() => continueFrom(2)}
              aria-disabled={!validation.valid || undefined}
            >
              Continue to Design
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </>
      )}

      {state.step === 3 && (
        <>
          <Button type="button" variant="outline" onClick={() => goToStep(2)}>
            <ArrowLeft aria-hidden />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <StartOverButton />
            <Button type="button" onClick={() => continueFrom(3)}>
              Continue to Download
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </>
      )}

      {state.step === 4 && (
        <>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => goToStep(2)}>
              <ArrowLeft aria-hidden />
              Edit Content
            </Button>
            <Button type="button" variant="outline" onClick={() => goToStep(3)}>
              Edit Design
            </Button>
          </div>
          <StartOverButton label="Start New QR Code" />
        </>
      )}
    </div>
  );
}
