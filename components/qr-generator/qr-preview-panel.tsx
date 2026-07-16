"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQRType } from "@/lib/qr/registry";
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

function MobilePagePreview() {
  const { state } = useQRWizard();
  const content = state.content;

  return (
    <div className="mx-auto w-full max-w-[240px]">
      {/* Phone frame */}
      <div className="rounded-[2rem] border-4 border-foreground/85 bg-background p-2.5 shadow-none">
        <div aria-hidden className="mx-auto mb-2 h-1 w-12 rounded-full bg-foreground/20" />
        <div className="min-h-[320px] overflow-y-auto rounded-[1.4rem] bg-muted/40 p-2.5">
          {!content && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-4 text-center">
              <Smartphone className="size-7 text-muted-foreground/60" aria-hidden />
              <p className="text-xs text-muted-foreground">
                Select a QR type to see what phones get when they scan.
              </p>
            </div>
          )}
          {content?.type === "website" && <WebsitePreview data={content.data} />}
          {content?.type === "whatsapp" && <WhatsAppPreview data={content.data} />}
          {content?.type === "wifi" && <WiFiPreview data={content.data} />}
          {content?.type === "vcard" && <VCardPreview data={content.data} />}
          {content?.type === "pdf" && <PdfPreview data={content.data} />}
          {content?.type === "links" && <LinksPreview data={content.data} />}
          {content?.type === "business" && <BusinessPreview data={content.data} />}
          {content?.type === "video" && <VideoPreview data={content.data} />}
          {content?.type === "images" && <ImagesPreview data={content.data} />}
          {content?.type === "facebook" && <FacebookPreview data={content.data} />}
          {content?.type === "instagram" && <InstagramPreview data={content.data} />}
          {content?.type === "social" && <SocialPreview data={content.data} />}
          {content?.type === "mp3" && <AudioPreview data={content.data} />}
          {content?.type === "menu" && <MenuPreview data={content.data} />}
          {content?.type === "apps" && <AppsPreview data={content.data} />}
          {content?.type === "coupon" && <CouponPreview data={content.data} />}
        </div>
      </div>
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
