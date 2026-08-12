"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IPhoneFrame } from "@/components/qr-preview/kit";
import { MobileDestination } from "@/components/qr-preview/screens";
import { getQRType } from "@/lib/qr/registry";
import {
  DEFAULT_PREVIEW_TYPE,
  qrTypePreviewAlt,
  qrTypePreviewImages,
} from "@/lib/qr/type-previews";
import type { QRType } from "@/lib/qr/types";
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

function MobilePagePreview() {
  const { state } = useQRWizard();
  const hovered = useHoveredType();

  // Two explicit modes (see lib/qr/type-previews.ts):
  //  - Step 1 → the supplied static sample artwork for
  //    hovered ?? selected ?? website. Hover never selects, never
  //    touches the URL, the draft, or the active tab.
  //  - Step 2+ → the REAL React destination rendered from the user's
  //    own content, with honest empty states.
  const previewType: QRType = hovered ?? state.selectedType ?? DEFAULT_PREVIEW_TYPE;
  const showSample = state.step === 1 || hovered !== null;
  const typeName = getQRType(showSample ? previewType : (state.content?.type ?? previewType)).name;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        {showSample ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-accent uppercase">
            <span className="size-1.5 rounded-full bg-accent" /> Sample
          </span>
        ) : (
          <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Live preview
          </span>
        )}
        <span className="text-[11px] font-medium text-muted-foreground">{typeName}</span>
      </div>
      {/* ONE phone shell, always mounted (no `key` → it never remounts, so it
          doesn't "re-appear" on every hover). Step 1 → only the sample IMAGE
          inside swaps per type; Step 2+ → the user's own live content. */}
      {showSample ? (
        <IPhoneFrame
          image={qrTypePreviewImages[previewType]}
          imageAlt={qrTypePreviewAlt(getQRType(previewType).name)}
        />
      ) : (
        <IPhoneFrame>
          <div
            key={state.content?.type ?? "empty"}
            className="min-h-full animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
          >
            {state.content && <MobileDestination content={state.content} />}
          </div>
        </IPhoneFrame>
      )}
    </div>
  );
}

function QRPreviewTab() {
  const { state, previewPayload, previewMode, needsPublishing, committed } = useQRWizard();
  const typeName = state.selectedType ? getQRType(state.selectedType).name : null;
  const isDesignPreview = previewMode === "design-preview";
  const isLiveHosted = previewMode === "live" && needsPublishing && committed;

  return (
    <div className="space-y-3">
      {/* What the user is looking at: a real design preview (hosted types
          before publish) or the live code that encodes the published link. */}
      {isDesignPreview ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/[0.06] px-3 py-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-accent uppercase">
            <span className="size-1.5 rounded-full bg-accent" /> Design preview
          </span>
          <span className="text-[11px] text-muted-foreground">Final link set on publish</span>
        </div>
      ) : isLiveHosted ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1B8A5B]/30 bg-[#1B8A5B]/[0.06] px-3 py-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[#1B8A5B] uppercase">
            <span className="size-1.5 rounded-full bg-[#1B8A5B]" /> Live QR
          </span>
          <span className="text-[11px] text-muted-foreground">Encodes your published link</span>
        </div>
      ) : null}

      <QRRenderer
        payload={previewPayload}
        design={state.design}
        type={state.selectedType}
        emptyHint={
          state.selectedType
            ? "Complete the required fields and the real QR code appears here."
            : "Select a QR type to get started."
        }
      />

      {previewMode === "live" && (
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {typeName}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {previewPayload.length} chars
          </span>
        </div>
      )}

      {isDesignPreview ? (
        <p className="px-1 text-xs text-muted-foreground">
          A real, scannable preview — every template, pattern, corner, gradient, logo,
          frame, and color renders exactly as it will on your final code.{" "}
          <span className="font-medium text-foreground">
            Your final destination is assigned when you publish
          </span>
          , and this preview is replaced by your live QR. It can&apos;t be downloaded until then.
        </p>
      ) : previewMode === "live" ? (
        <p className="px-1 text-xs text-muted-foreground">
          Test this QR code with your phone before printing or publishing it.
        </p>
      ) : null}
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
