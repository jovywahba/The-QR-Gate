"use client";

import * as React from "react";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AccountNav } from "@/components/marketing/account-nav";
import { Button } from "@/components/ui/button";
import type { QRType, WizardStep } from "@/lib/qr/types";
import { cn } from "@/lib/utils";
import { HoverPreviewProvider } from "./hover-preview";
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
  const { state } = useQRWizard();
  // On Step 3 (design), pin the preview so the QR stays in view and the
  // user watches it update while scrolling the long list of controls.
  // Other steps keep the preview in normal flow (it scrolls with the page).
  const pinPreview = state.step === 3;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <FocusStepHeading />
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          {/* Full stepper only where there's room; a compact one sits below
              it otherwise, so the header never overflows on smaller desktops. */}
          <QRStepper className="hidden xl:block" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs">
                <CircleHelp aria-hidden />
                <span className="hidden sm:inline">Help</span>
                <span className="sr-only sm:hidden">Help</span>
              </Link>
            </Button>
            <AccountNav />
          </div>
        </div>
        <div className="border-t px-4 py-2 xl:hidden">
          <QRStepper compact />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-28 sm:px-6 lg:pb-12">
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            <QRStepContent />
            <WizardActions />
          </div>
          <aside
            className={cn("hidden w-[360px] shrink-0 lg:block", pinPreview && "lg:self-stretch")}
            aria-label="Live preview"
          >
            <div className={cn("rounded-xl border bg-card p-4", pinPreview && "lg:sticky lg:top-24")}>
              <QRPreviewPanel autoSwitch />
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
  trackingMode?: string;
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
      <HoverPreviewProvider>
        <BuilderShell />
      </HoverPreviewProvider>
    </QRWizardProvider>
  );
}
