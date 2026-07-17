"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { BatteryFull, QrCode, Signal, Wifi } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQRType } from "@/lib/qr/registry";
import { sampleContentFor } from "@/lib/qr/sample-previews";
import type { QRContent } from "@/lib/qr/types";
import { site } from "@/lib/site";
import { useHoveredType } from "./hover-preview";
import { AppsPreview } from "./previews/apps-preview";
import { AudioPreview } from "./previews/audio-preview";
import { BusinessPreview } from "./previews/business-preview";
import { CouponPreview } from "./previews/coupon-preview";
import { FacebookPreview } from "./previews/facebook-preview";
import { ImagesPreview } from "./previews/images-preview";
import { InstagramPreview } from "./previews/instagram-preview";
import { LinksPreview } from "./previews/links-preview";
import { MenuPreview } from "./previews/menu-preview";
import { PdfPreview } from "./previews/pdf-preview";
import { SocialPreview } from "./previews/social-preview";
import { VCardPreview } from "./previews/vcard-preview";
import { VideoPreview } from "./previews/video-preview";
import { WebsitePreview } from "./previews/website-preview";
import { WhatsAppPreview } from "./previews/whatsapp-preview";
import { WiFiPreview } from "./previews/wifi-preview";
import { useQRWizard } from "./use-qr-wizard";

/**
 * The live preview column: "Mobile Page" (an accurate destination
 * summary for direct types; hosted-page preview lands in Part 3) and
 * "QR Preview" (the real generated code).
 *
 * qr-code-styling is browser-only → the renderer loads with ssr: false.
 */
const QRRenderer = dynamic(() => import("./qr-renderer"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full rounded-lg" />,
});

/** Renders the destination view for any content type (real or sample). */
function DestinationView({ content }: { content: QRContent }) {
  switch (content.type) {
    case "website":
      return <WebsitePreview data={content.data} />;
    case "whatsapp":
      return <WhatsAppPreview data={content.data} />;
    case "wifi":
      return <WiFiPreview data={content.data} />;
    case "vcard":
      return <VCardPreview data={content.data} />;
    case "pdf":
      return <PdfPreview data={content.data} />;
    case "links":
      return <LinksPreview data={content.data} />;
    case "business":
      return <BusinessPreview data={content.data} />;
    case "video":
      return <VideoPreview data={content.data} />;
    case "images":
      return <ImagesPreview data={content.data} />;
    case "facebook":
      return <FacebookPreview data={content.data} />;
    case "instagram":
      return <InstagramPreview data={content.data} />;
    case "social":
      return <SocialPreview data={content.data} />;
    case "mp3":
      return <AudioPreview data={content.data} />;
    case "menu":
      return <MenuPreview data={content.data} />;
    case "apps":
      return <AppsPreview data={content.data} />;
    case "coupon":
      return <CouponPreview data={content.data} />;
  }
}

/** A phone-shaped shell: bezel, notch, status bar, screen, home indicator. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[248px]">
      <div className="rounded-[2.2rem] border-[6px] border-foreground/85 bg-foreground/85 shadow-sm">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-background">
          {/* Status bar + notch */}
          <div className="relative flex items-center justify-between px-4 pt-2 pb-1">
            <span className="font-mono text-[10px] font-medium tracking-tight">9:41</span>
            <span
              aria-hidden
              className="absolute top-1.5 left-1/2 h-4 w-14 -translate-x-1/2 rounded-full bg-foreground/85"
            />
            <span className="flex items-center gap-1 text-foreground/70" aria-hidden>
              <Signal className="size-3" />
              <Wifi className="size-3" />
              <BatteryFull className="size-3.5" />
            </span>
          </div>
          {/* Screen */}
          <div className="max-h-[430px] min-h-[330px] overflow-y-auto bg-muted/30 px-2.5 pt-1 pb-4">
            {children}
          </div>
          {/* Home indicator */}
          <div className="flex justify-center bg-background py-1.5">
            <span aria-hidden className="h-1 w-20 rounded-full bg-foreground/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Default screen when nothing is hovered or in progress. */
function WelcomeScreen() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border bg-card">
        <QrCode className="size-6 text-accent" aria-hidden />
      </span>
      <p className="text-sm font-semibold">{site.name}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Hover a QR type to preview what people see when they scan — then pick one to start.
      </p>
    </div>
  );
}

function MobilePagePreview() {
  const { state } = useQRWizard();
  const hovered = useHoveredType();

  // Preview priority: hovered sample → the real form content → welcome.
  // Hovering only ever happens on Step 1 (the grid), so this never
  // overrides the live form data on Steps 2–4.
  const sample = React.useMemo(() => (hovered ? sampleContentFor(hovered) : null), [hovered]);
  const content = sample ?? state.content;
  const activeType = hovered ?? state.selectedType ?? content?.type ?? null;
  const typeName = activeType ? getQRType(activeType).name : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {sample ? "Sample preview" : "Mobile page"}
        </span>
        {typeName && <span className="text-[11px] font-medium text-muted-foreground">{typeName}</span>}
      </div>
      <PhoneFrame>{content ? <DestinationView content={content} /> : <WelcomeScreen />}</PhoneFrame>
      {sample && (
        <p className="px-1 text-center text-[11px] leading-relaxed text-muted-foreground">
          Example content — your own details appear here as you fill the form.
        </p>
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

export function QRPreviewPanel({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Tabs defaultValue="qr">
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
