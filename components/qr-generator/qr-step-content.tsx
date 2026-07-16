"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { getQRType } from "@/lib/qr/registry";
import { WIZARD_STEPS } from "@/lib/qr/types";
import { DesignEditor } from "./design/design-editor";
import { DownloadPanel } from "./download-panel";
import { AppsForm } from "./forms/apps-form";
import { BusinessForm } from "./forms/business-form";
import { CouponForm } from "./forms/coupon-form";
import { FacebookForm } from "./forms/facebook-form";
import { ImagesForm } from "./forms/images-form";
import { InstagramForm } from "./forms/instagram-form";
import { LinksForm } from "./forms/links-form";
import { MenuForm } from "./forms/menu-form";
import { MP3Form } from "./forms/mp3-form";
import { PDFForm } from "./forms/pdf-form";
import { SocialForm } from "./forms/social-form";
import { VCardForm } from "./forms/vcard-form";
import { VideoForm } from "./forms/video-form";
import { WebsiteForm } from "./forms/website-form";
import { WhatsAppForm } from "./forms/whatsapp-form";
import { WiFiForm } from "./forms/wifi-form";
import { PublishPanel } from "./publish-panel";
import { QRTypeGrid } from "./qr-type-grid";
import { useQRWizard } from "./use-qr-wizard";

const QRRenderer = dynamic(() => import("./qr-renderer"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full rounded-lg" />,
});

/**
 * The main column for each step. The heading carries id
 * `qr-step-heading` — the layout moves focus to it on step change.
 */

function StepHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <header className="mb-6 space-y-1">
      <h1 id="qr-step-heading" tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
        {children}
      </h1>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </header>
  );
}

export function QRStepContent() {
  const { state, needsPublishing, readability } = useQRWizard();
  const definition = state.selectedType ? getQRType(state.selectedType) : null;
  const stepName = WIZARD_STEPS.find((s) => s.step === state.step)!.name;

  if (state.step === 1) {
    return (
      <section aria-label={stepName}>
        <StepHeading sub="What should scanning your code do? Pick one — you can always come back.">
          Select QR Type
        </StepHeading>
        <QRTypeGrid />
      </section>
    );
  }

  if (state.step === 2) {
    return (
      <section aria-label={stepName}>
        <StepHeading
          sub={
            definition
              ? `${definition.name} — ${definition.description}. The preview updates live as you type.`
              : undefined
          }
        >
          Add Content
        </StepHeading>
        {state.content?.type === "website" && <WebsiteForm />}
        {state.content?.type === "whatsapp" && <WhatsAppForm />}
        {state.content?.type === "wifi" && <WiFiForm />}
        {state.content?.type === "vcard" && <VCardForm />}
        {state.content?.type === "pdf" && <PDFForm />}
        {state.content?.type === "links" && <LinksForm />}
        {state.content?.type === "business" && <BusinessForm />}
        {state.content?.type === "video" && <VideoForm />}
        {state.content?.type === "images" && <ImagesForm />}
        {state.content?.type === "facebook" && <FacebookForm />}
        {state.content?.type === "instagram" && <InstagramForm />}
        {state.content?.type === "social" && <SocialForm />}
        {state.content?.type === "mp3" && <MP3Form />}
        {state.content?.type === "menu" && <MenuForm />}
        {state.content?.type === "apps" && <AppsForm />}
        {state.content?.type === "coupon" && <CouponForm />}
      </section>
    );
  }

  if (state.step === 3) {
    return (
      <section aria-label={stepName}>
        <StepHeading sub="Style the code — every control changes the real QR in the preview.">
          Design QR Code
        </StepHeading>
        <DesignEditor />
      </section>
    );
  }

  // Step 4 — Download (hosted types publish here first)
  return (
    <section aria-label={stepName}>
      <StepHeading
        sub={
          needsPublishing
            ? "Publish your page, then download the QR as a 1024 × 1024 PNG."
            : "Your QR code is ready. Download it as a 1024 × 1024 PNG."
        }
      >
        Download QR Code
      </StepHeading>
      <div className="mx-auto max-w-sm space-y-3">
        {needsPublishing && <PublishPanel />}
        <QRRenderer
          payload={state.generatedPayload}
          design={state.design}
          emptyHint={
            needsPublishing
              ? "Publish first — the QR encodes your published page's URL."
              : "Nothing to download yet — go back and complete the content step."
          }
        />
        {state.generatedPayload && state.selectedType && (
          <div className="rounded-lg border bg-card px-3 py-2">
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {needsPublishing ? "Published destination" : "Direct destination"}
            </p>
            <p className="mt-0.5 font-mono text-xs break-all">
              {state.generatedPayload.length > 200
                ? `${state.generatedPayload.slice(0, 200)}…`
                : state.generatedPayload}
            </p>
          </div>
        )}
        <DownloadPanel />
        {!readability.isSafe && (
          <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <p className="text-sm font-semibold text-destructive">This design isn&apos;t scan-safe</p>
            <ul className="mt-1 space-y-0.5">
              {readability.issues
                .filter((i) => i.level === "error")
                .map((issue) => (
                  <li key={issue.code} className="text-xs text-destructive">
                    {issue.message}
                  </li>
                ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              Go back to Design QR Code to fix it — download stays disabled until then.
            </p>
          </div>
        )}
        <p className="text-center text-sm text-muted-foreground">
          Test this QR code with your phone before printing or publishing it.
        </p>
      </div>
    </section>
  );
}
