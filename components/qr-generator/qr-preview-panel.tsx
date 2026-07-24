"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneFrame } from "@/components/qr-preview/kit";
import { MobileDestination } from "@/components/qr-preview/screens";
import { getQRType, QR_TYPES } from "@/lib/qr/registry";
import {
  DEFAULT_PREVIEW_TYPE,
  qrTypePreviewAlt,
  qrTypePreviewImages,
} from "@/lib/qr/type-previews";
import type { QRType } from "@/lib/qr/types";
import { cn } from "@/lib/utils";
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

/**
 * Step-1 sample phone. A compact iPhone-proportioned shell (9 : 19.5)
 * with an Apple-style Dynamic Island. Each supplied image FILLS the
 * screen (object-cover, anchored to the top) so there's no empty band
 * below it and nothing scrolls. All 16 are mounted and eagerly loaded,
 * then cross-faded by opacity, so hovering between cards is instant.
 */
function StaticPhone({ type }: { type: QRType }) {
  return (
    <div className="mx-auto w-[230px] xl:w-[250px]">
      <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[46px] border-[7px] border-[#20212B] bg-black shadow-[0_18px_45px_rgba(27,27,47,0.18)]">
        {/* Screen — the supplied artwork covers it edge to edge. */}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] bg-white">
          {QR_TYPES.map((definition) => {
            const active = definition.id === type;
            return (
              <Image
                key={definition.id}
                src={qrTypePreviewImages[definition.id]}
                alt={active ? qrTypePreviewAlt(definition.name) : ""}
                aria-hidden={!active}
                fill
                sizes="254px"
                // All eagerly loaded so switching is instant, no flash.
                {...(definition.id === DEFAULT_PREVIEW_TYPE ? { priority: true } : { loading: "eager" as const })}
                className={cn(
                  "object-cover object-top transition-opacity duration-200 ease-out motion-reduce:transition-none",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            );
          })}
        </div>
        {/* Dynamic Island — above the artwork, fixed (the screen doesn't scroll). */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-2.5 left-1/2 z-30 h-[19px] w-[68px] -translate-x-1/2 rounded-full bg-[#09090B] shadow-sm"
        />
      </div>
    </div>
  );
}

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
      {/* Step 1 → the compact static sample phone (its own shell, since the
          image already IS a full screen). Step 2+ → the real interactive
          destination in the standard phone frame. */}
      {showSample ? (
        <StaticPhone type={previewType} />
      ) : (
        <PhoneFrame>
          <div
            key={state.content?.type ?? "empty"}
            className="min-h-full animate-in fade-in-0 slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
          >
            {state.content && <MobileDestination content={state.content} />}
          </div>
        </PhoneFrame>
      )}
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
