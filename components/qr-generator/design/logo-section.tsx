"use client";

import * as React from "react";
import { ImagePlus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MAX_LOGO_SIZE, MIN_LOGO_SIZE } from "@/lib/qr/readability";
import { sniffMagicBytes } from "@/lib/qr/uploads";
import { useQRWizard } from "../use-qr-wizard";
import { RangeField } from "./style-option-group";

/**
 * Logo inside the QR — fully local (validated data URL), no auth or
 * Supabase involved. Adding a logo forces error correction H; size is
 * clamped to the scan-safe 10–25% window.
 */
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_KINDS = new Set(["png", "jpeg", "webp"]);
const MIN_DIMENSION = 24;
const MAX_DIMENSION = 4096;

function loadImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("not-an-image"));
    img.src = dataUrl;
  });
}

export function LogoSection() {
  const { state, patchDesign } = useQRWizard();
  const design = state.design;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      if (file.size > MAX_LOGO_BYTES) {
        setError("The logo must be under 2 MB.");
        return;
      }
      const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
      const kind = sniffMagicBytes(head);
      if (!kind || !ACCEPTED_KINDS.has(kind)) {
        setError("Use a PNG, JPEG, or WebP image.");
        return;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read-failed"));
        reader.readAsDataURL(file);
      });
      const { width, height } = await loadImageSize(dataUrl);
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        setError(`The image is too small — at least ${MIN_DIMENSION}px on each side.`);
        return;
      }
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        setError(`The image is too large — at most ${MAX_DIMENSION}px on each side.`);
        return;
      }
      patchDesign({
        logoDataUrl: dataUrl,
        logoFileName: file.name,
        // A logo eats modules — H keeps the code decodable.
        errorCorrection: "H",
      });
    } catch {
      setError("Couldn't read that image. Try a different file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const needsReselect = design.logoFileName && !design.logoDataUrl;

  return (
    <div className="space-y-4">
      {needsReselect && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Please select your logo again — image data isn&apos;t kept across refreshes for large files.
        </p>
      )}

      {design.logoDataUrl ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
          {/* Local validated data URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={design.logoDataUrl} alt="" className="size-12 shrink-0 rounded-md border object-contain" />
          <p className="min-w-0 flex-1 truncate font-mono text-xs">{design.logoFileName}</p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => patchDesign({ logoDataUrl: null, logoFileName: null })}
            aria-label="Remove logo"
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus aria-hidden />
          {busy ? "Reading…" : "Add a logo"}
        </Button>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        PNG, JPEG, or WebP up to 2 MB. Adding a logo switches error correction to H so the code
        stays scannable.
      </p>

      {design.logoDataUrl && (
        <>
          <RangeField
            id="qr-design-logo-size"
            label="Logo size"
            value={design.logoSize}
            min={MIN_LOGO_SIZE}
            max={MAX_LOGO_SIZE}
            unit="%"
            onChange={(logoSize) => patchDesign({ logoSize })}
            hint="Capped at 25% — larger logos make QR codes hard to scan."
          />
          <RangeField
            id="qr-design-logo-margin"
            label="Logo margin"
            value={design.logoMargin}
            min={0}
            max={12}
            onChange={(logoMargin) => patchDesign({ logoMargin })}
          />
          <div className="flex items-center justify-between rounded-lg border bg-background p-3">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="qr-design-logo-bg">Clear space behind logo</Label>
              <p className="text-xs text-muted-foreground">Hides the QR dots underneath the logo.</p>
            </div>
            <Switch
              id="qr-design-logo-bg"
              checked={design.logoBackground}
              onCheckedChange={(logoBackground) => patchDesign({ logoBackground })}
            />
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
