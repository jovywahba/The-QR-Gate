"use client";

import * as React from "react";
import {
  BarChart3,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  Info,
  LoaderCircle,
  LogIn,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useQRWizard } from "./use-qr-wizard";

/**
 * Step 4 — finalize. EVERY QR is committed to the account here (this
 * is the auth + free-quota gate). Hosted/tracked types publish a page
 * or short link; direct types just save the record; native WiFi/vCard
 * are saved but honestly marked un-trackable. Nothing fakes success.
 */
export function FinalizePanel() {
  const {
    state,
    validation,
    user,
    authReady,
    publishingConfig,
    publishError,
    commit,
    signInToPublish,
    needsPublishing,
    committed,
    trackingMode,
    canToggleTracking,
    trackingEnabled,
    setTrackingEnabled,
    plan,
  } = useQRWizard();

  const status = state.publishingStatus;

  // Supabase off: hosted types can't work; direct/native download directly.
  if (!publishingConfig.configured) {
    if (trackingMode !== "hosted") return null;
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Publishing isn&apos;t configured</p>
          <p className="text-sm text-muted-foreground">
            This QR type needs a hosted page, which requires Supabase. Missing:{" "}
            <span className="font-mono text-xs">{publishingConfig.missing.join(", ")}</span>.
          </p>
        </div>
      </div>
    );
  }

  const trackingRow = canToggleTracking ? (
    <label className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
      <span className="flex items-start gap-2.5">
        <BarChart3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium">Track scans</span>
          <span className="block text-xs text-muted-foreground">
            Encodes a {trackingEnabled ? "short link that records each scan, then forwards to your URL" : "your URL directly (no analytics)"}.
          </span>
        </span>
      </span>
      <Switch checked={trackingEnabled} onCheckedChange={setTrackingEnabled} aria-label="Track scans" />
    </label>
  ) : null;

  const nativeNote =
    trackingMode === "native" ? (
      <div className="flex items-start gap-2.5 rounded-lg border bg-muted/40 p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-xs text-muted-foreground">
          Scan analytics are unavailable for native{" "}
          {state.selectedType === "wifi" ? "WiFi" : "contact"} QR codes — scanning them{" "}
          {state.selectedType === "wifi" ? "connects" : "imports"} directly without touching our servers.
        </p>
      </div>
    ) : null;

  // Already committed → success.
  if (committed) {
    return (
      <div className="space-y-3">
        {trackingRow}
        {nativeNote}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#1B8A5B]" aria-hidden />
            <p className="text-sm font-semibold">Saved to your account</p>
          </div>
          {needsPublishing && state.publicUrl ? (
            <>
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  {trackingMode === "hosted" ? "Public page" : "Tracked link"}
                </p>
                <p className="mt-0.5 font-mono text-sm break-all">{state.publicUrl}</p>
              </div>
              {trackingMode === "hosted" && (
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={state.publicUrl} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden />
                    Open the public page
                  </a>
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Your QR code is ready to download below.</p>
          )}
        </div>
      </div>
    );
  }

  const republish = Boolean(state.slug);
  const commitLabel = needsPublishing ? (republish ? "Publish changes" : "Publish") : "Save & get your QR";

  return (
    <div className="space-y-3">
      {trackingRow}
      {nativeNote}
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div>
          <p className="text-sm font-semibold">Save your QR code</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {needsPublishing
              ? "This QR lives on a hosted link — save it to your account to generate the code."
              : "Save this QR to your account, then download it. You can manage it from your dashboard."}
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
              Sign in to continue — everything you&apos;ve entered is kept and you&apos;ll come right back here.
            </p>
            <Button type="button" onClick={signInToPublish}>
              <LogIn aria-hidden />
              Sign in to continue
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {plan && !plan.isUnlimited && (
              <p className="font-mono text-xs text-muted-foreground">
                {plan.activeCount} of {plan.limit ?? 3} free QR codes used
              </p>
            )}
            <Button
              type="button"
              onClick={() => void commit()}
              disabled={status === "saving" || !authReady}
              aria-disabled={!validation.valid || undefined}
            >
              {status === "saving" ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <CloudUpload aria-hidden />
                  {publishError ? "Try again" : commitLabel}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
