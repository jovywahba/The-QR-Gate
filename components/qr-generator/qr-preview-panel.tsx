"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneFrame } from "@/components/qr-preview/kit";
import { MobileDestination } from "@/components/qr-preview/screens";
import { demoFixtureFor } from "@/lib/qr/demo-fixtures";
import { getQRType } from "@/lib/qr/registry";
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

  // Two explicit modes:
  //  - Demo  (homepage hover, or the default before any selection): a
  //    real Live-demo fixture, always badged "Live demo".
  //  - User  (a type is selected + content exists): only the user's real
  //    data, with honest empty states — no demo values leak in.
  // Hover only happens on Step 1, so user data (Steps 2–4) is never
  // overridden, and hover never touches URL or draft state.
  let content: QRContent;
  let demo: boolean;
  if (hovered) {
    content = demoFixtureFor(hovered);
    demo = true;
  } else if (state.content) {
    content = state.content;
    demo = false;
  } else {
    content = demoFixtureFor(DEFAULT_PREVIEW_TYPE);
    demo = true;
  }
  const typeName = getQRType(content.type).name;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        {demo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-accent uppercase">
            <span className="size-1.5 rounded-full bg-accent" /> Live demo
          </span>
        ) : (
          <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Live preview
          </span>
        )}
        <span className="text-[11px] font-medium text-muted-foreground">{typeName}</span>
      </div>
      <PhoneFrame>
        {/* Only the screen content cross-fades — the frame stays put. */}
        <div
          key={content.type + String(demo)}
          className="min-h-full animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
        >
          <MobileDestination content={content} />
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
        type={state.selectedType}
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
