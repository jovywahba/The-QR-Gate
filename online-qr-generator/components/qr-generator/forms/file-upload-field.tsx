"use client";

import * as React from "react";
import { FileText, ImageIcon, LogIn, Music, RefreshCw, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AssetRef } from "@/lib/qr/types";
import { refreshAssetPreview, removeAsset, uploadAsset, UploadError } from "@/lib/qr/uploads-client";
import { UPLOAD_RULES, type AssetType } from "@/lib/qr/uploads";
import { cn } from "@/lib/utils";
import { useQRWizard } from "../use-qr-wizard";

/**
 * The one real upload control: pre-flights locally, uploads straight
 * to storage with live progress, and only reports an AssetRef after
 * the server verified the stored bytes. Signed-out users get an
 * honest sign-in path — never a fake "uploaded" state.
 */

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function KindIcon({ assetType, className }: { assetType: AssetType; className?: string }) {
  const Icon =
    assetType === "pdf"
      ? FileText
      : assetType === "audio"
        ? Music
        : assetType === "video"
          ? Video
          : ImageIcon;
  return <Icon className={className} aria-hidden />;
}

export function FileUploadField({
  id,
  label,
  assetType,
  value,
  onChange,
  required = false,
  error,
  hint,
}: {
  id: string;
  label: string;
  assetType: AssetType;
  value: AssetRef | null;
  onChange: (ref: AssetRef | null) => void;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  const { state, user, authReady, publishingConfig, signInToPublish, registerQrCodeId } = useQRWizard();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(value?.previewUrl);

  const rule = UPLOAD_RULES[assetType];
  const isImage = value?.mimeType.startsWith("image/") ?? false;

  /* Restored drafts have the asset reference but not the (transient)
     signed preview URL — refresh it for the owner. */
  React.useEffect(() => {
    setPreviewUrl(value?.previewUrl);
    if (value && !value.previewUrl && user && value.mimeType.startsWith("image/")) {
      let cancelled = false;
      refreshAssetPreview(value.assetId).then((url) => {
        if (!cancelled && url) setPreviewUrl(url);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [value, user]);

  const busy = progress !== null || removing;

  const handleSelect = async (file: File) => {
    setLocalError(null);
    setProgress(0);
    const previous = value;
    try {
      const result = await uploadAsset({
        file,
        assetType,
        qrType: state.selectedType!,
        qrCodeId: state.qrCodeId,
        onProgress: setProgress,
      });
      registerQrCodeId(result.qrCodeId);
      onChange(result.ref);
      // Cleanup the replaced file — but never storage a published page
      // may still reference (republish detaches it from content first).
      if (previous && !state.slug) {
        void removeAsset(previous.assetId).catch(() => undefined);
      }
    } catch (err) {
      if (err instanceof UploadError && err.status === 401) {
        setLocalError("Sign in to upload files — your draft is saved.");
      } else {
        setLocalError(err instanceof UploadError ? err.message : "The upload failed. Please try again.");
      }
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    setRemoving(true);
    setLocalError(null);
    try {
      // Published records keep their stored files (the live /q page may
      // reference them) — removal just detaches; unpublished drafts
      // delete the object + row for real.
      if (!state.slug) await removeAsset(value.assetId);
      onChange(null);
    } catch {
      setLocalError("Couldn't remove the file. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  const shownError = localError ?? error;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {!required && (
          <span className="ml-1.5 font-mono text-[10px] text-muted-foreground uppercase">optional</span>
        )}
      </Label>

      {!publishingConfig.configured ? (
        <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
          Uploads aren&apos;t configured on this deployment — missing{" "}
          <span className="font-mono text-xs">{publishingConfig.missing.join(", ")}</span>.
        </div>
      ) : authReady && !user ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-3">
          <p className="text-sm text-muted-foreground">
            Sign in to upload files. Everything you&apos;ve typed is kept.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={signInToPublish}>
            <LogIn aria-hidden />
            Sign in to upload
          </Button>
        </div>
      ) : value ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          {isImage && previewUrl ? (
            // Signed, short-lived preview URL — plain <img> on purpose.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="size-12 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted/40">
              <KindIcon assetType={assetType} className="size-5 text-muted-foreground" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="font-mono text-xs text-muted-foreground">{formatFileSize(value.fileSize)}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              aria-label={`Replace ${label}`}
            >
              <RefreshCw />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={busy}
              onClick={handleRemove}
              aria-label={`Remove ${label}`}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          id={id}
          disabled={busy || !authReady}
          onClick={() => inputRef.current?.click()}
          aria-describedby={shownError ? `${id}-error` : `${id}-hint`}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-6 text-center transition-colors",
            "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-60",
            shownError && "border-destructive",
          )}
        >
          <Upload className="size-5 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">Choose a file</span>
          <span className="text-xs text-muted-foreground">{rule.label}</span>
        </button>
      )}

      {progress !== null && (
        <div role="status" aria-live="polite" className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-mono text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}

      {hint && !shownError && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {shownError && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {shownError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={rule.extensions.join(",")}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleSelect(file);
        }}
      />
    </div>
  );
}
