"use client";

import * as React from "react";
import { CheckCircle2, CloudUpload, ExternalLink, LoaderCircle, LogIn, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppUrl } from "@/lib/qr/public-url";
import { useQRWizard } from "./use-qr-wizard";

/**
 * Step 4 for hosted types: the QR can only encode a real published
 * /q/[slug] URL, so publishing happens here — with honest states for
 * sign-in, saving, success, and failure. Nothing fakes success.
 */
export function PublishPanel() {
  const { state, validation, user, authReady, publishingConfig, publishError, publish, signInToPublish } =
    useQRWizard();

  const status = state.publishingStatus;

  if (!publishingConfig.configured) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Publishing isn&apos;t configured</p>
          <p className="text-sm text-muted-foreground">
            This QR type needs a hosted page, which requires Supabase. Missing:{" "}
            <span className="font-mono text-xs">{publishingConfig.missing.join(", ")}</span>. Direct QR
            types (Website, WhatsApp, WiFi, vCard, Facebook, Instagram) keep working without it.
          </p>
        </div>
      </div>
    );
  }

  if (status === "published" && state.publicUrl) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[#1B8A5B]" aria-hidden />
          <p className="text-sm font-semibold">Published</p>
        </div>
        <div className="rounded-md border bg-muted/40 px-3 py-2">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            Published destination
          </p>
          <p className="mt-0.5 font-mono text-sm break-all">{state.publicUrl}</p>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={state.publicUrl} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden />
            Open the public page
          </a>
        </Button>
      </div>
    );
  }

  const republish = Boolean(state.slug);

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">
          {republish ? "Publish your changes" : "Publish to get your QR code"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          This QR type lives on a hosted page. The code encodes{" "}
          <span className="font-mono text-xs break-all">
            {republish && state.publicUrl ? state.publicUrl : `${getAppUrl()}/q/…`}
          </span>
          {republish ? " — republishing keeps the same link, so printed codes stay valid." : "."}
        </p>
      </div>

      {publishError && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {publishError}
        </p>
      )}

      {authReady && !user ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Sign in to publish — everything you&apos;ve entered is kept and you&apos;ll come right back here.
          </p>
          <Button type="button" onClick={signInToPublish}>
            <LogIn aria-hidden />
            Sign in to publish
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => void publish()}
          disabled={status === "saving" || !authReady}
          aria-disabled={!validation.valid || undefined}
        >
          {status === "saving" ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden />
              Publishing…
            </>
          ) : (
            <>
              <CloudUpload aria-hidden />
              {publishError ? "Try again" : republish ? "Publish changes" : "Publish"}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
