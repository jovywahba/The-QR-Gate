"use client";

import * as React from "react";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { QRType, WizardStep } from "@/lib/qr/types";
import { QRMobilePreviewSheet } from "./qr-mobile-preview-sheet";
import { QRPreviewPanel } from "./qr-preview-panel";
import { QRStepContent } from "./qr-step-content";
import { QRStepper } from "./qr-stepper";
import { QRWizardProvider, useQRWizard } from "./use-qr-wizard";
import { WizardActions } from "./wizard-actions";

/**
 * The builder shell: header (logo · stepper · help), main form column,
 * sticky ~336px preview column on desktop, bottom-sheet preview on
 * mobile. Homepage renders it at Step 1; /create drives it from the URL.
 */

function FocusStepHeading() {
  const { state } = useQRWizard();
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    document.getElementById("qr-step-heading")?.focus({ preventScroll: false });
  }, [state.step]);
  return null;
}

function BuilderShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <FocusStepHeading />
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <QRStepper className="hidden md:block" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs">
              <CircleHelp aria-hidden />
              <span className="hidden sm:inline">Help</span>
              <span className="sr-only sm:hidden">Help</span>
            </Link>
          </Button>
        </div>
        <div className="border-t px-4 py-2 md:hidden">
          <QRStepper compact />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-28 sm:px-6 lg:pb-12">
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <QRStepContent />
            <WizardActions />
          </div>
          <aside className="hidden w-[336px] shrink-0 lg:block" aria-label="Live preview">
            <div className="sticky top-24 rounded-lg border bg-card p-4">
              <QRPreviewPanel />
            </div>
          </aside>
        </div>
      </main>

      <QRMobilePreviewSheet />
    </div>
  );
}

/** A saved qr_codes row, loaded server-side with ownership verified. */
export type SavedQRRecord = {
  qrCodeId: string;
  content: import("@/lib/qr/types").QRContent | null;
  design: unknown;
  slug: string | null;
  publicUrl: string | null;
  published: boolean;
};

export function QRBuilder({
  initialType = null,
  initialStep = 1,
  initialRecord,
}: {
  initialType?: QRType | null;
  initialStep?: WizardStep;
  initialRecord?: SavedQRRecord;
}) {
  return (
    <QRWizardProvider initialType={initialType} initialStep={initialStep} initialRecord={initialRecord}>
      <BuilderShell />
    </QRWizardProvider>
  );
}
