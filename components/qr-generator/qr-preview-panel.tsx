"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneFrame } from "@/components/qr-preview/kit";
import { MobileDestination } from "@/components/qr-preview/screens";
import { getQRType } from "@/lib/qr/registry";
import { sampleContentFor } from "@/lib/qr/sample-previews";
import type { QRContent, QRType } from "@/lib/qr/types";
import { useHoveredType } from "./hover-preview";
import { useQRWizard } from "./use-qr-wizard";

/**
 * The live preview column with two tabs:
 *  - "Mobile Page": a realistic phone rendering the destination
 *    (Step-1 hover sample, or the live form data on Steps 2–4).
 *  - "QR Preview": the real generated code.
 *
 * Tab behavior: Step 1 stays on Mobile Page (hover never switches it);
 * selecting a type advances to Step 2 and the desktop panel auto-opens
 * QR Preview (`autoSwitch`). The mobile sheet always opens on Mobile Page.
 */
const QRRenderer = dynamic(() => import("./qr-renderer"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full rounded-lg" />,
});

/** Website is the friendly default before anything is hovered/selected. */
const DEFAULT_PREVIEW_TYPE: QRType = "website";

function MobilePagePreview() {
  const { state } = useQRWizard();
  const hovered = useHoveredType();

  // previewType = hovered ?? selected/live ?? default(website).
  // Hover only happens on Step 1, so live form data (Steps 2–4) is
  // never overridden. Hover never touches URL or draft state.
  let content: QRContent;
  let sample: boolean;
  if (hovered) {
    content = sampleContentFor(hovered);
    sample = true;
  } else if (state.content) {
    content = state.content;
    sample = false;
  } else {
    content = sampleContentFor(DEFAULT_PREVIEW_TYPE);
    sample = true;
  }
  const typeName = getQRType(content.type).name;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {sample ? "Sample" : "Live preview"}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">{typeName}</span>
      </div>
      <PhoneFrame>
        {/* Only the screen content cross-fades — the frame stays put. */}
        <div
          key={content.type + String(sample)}
          className="min-h-full animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
        >
          <MobileDestination content={content} sample={sample} />
        </div>
      </PhoneFrame>
    </div>
  );
}

function QRPreviewTab() {
  const { state, needsPublishing } = useQRWizard();
  const typeName = state.selectedType ? getQRType(state.selectedType).name : null;

  return (
    <div className="space-y-3">
      <QRRenderer
        payload={state.generatedPayload}
        design={state.design}
        emptyHint={
          state.selectedType
            ? needsPublishing
              ? "This QR type lives on a hosted page — complete the form, then publish in the Download step to generate the real code."
              : "Complete the required fields and the real QR code appears here."
            : "Select a QR type to get started."
        }
      />
      {state.generatedPayload && (
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {typeName}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {state.generatedPayload.length} chars
          </span>
        </div>
      )}
      {state.generatedPayload && (
        <p className="px-1 text-xs text-muted-foreground">
          Test this QR code with your phone before printing or publishing it.
        </p>
      )}
    </div>
  );
}

export function QRPreviewPanel({
  className,
  autoSwitch = false,
}: {
  className?: string;
  /** Desktop panel: jump to QR Preview once a type is selected (step ≥ 2). */
  autoSwitch?: boolean;
}) {
  const { state } = useQRWizard();
  const [tab, setTab] = React.useState<string>(() => (autoSwitch && state.step >= 2 ? "qr" : "mobile"));

  React.useEffect(() => {
    if (autoSwitch) setTab(state.step >= 2 ? "qr" : "mobile");
  }, [state.step, autoSwitch]);

  return (
    <div className={className}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="mobile">Mobile Page</TabsTrigger>
          <TabsTrigger value="qr">QR Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="mobile" className="pt-3">
          <MobilePagePreview />
        </TabsContent>
        <TabsContent value="qr" className="pt-3">
          <QRPreviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
