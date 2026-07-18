"use client";

import * as React from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadQRCode, exportFileName } from "@/lib/qr/download";
import { PNG_EXPORT_SIZES, type PNGExportSize, type QRExportFormat } from "@/lib/qr/styling";
import { useQRWizard } from "./use-qr-wizard";

/**
 * Step-4 export controls: PNG at real 512/1024/2048 resolutions or a
 * true vector SVG — both through the shared renderer options. When
 * download is blocked, the exact reason is shown, never a silent
 * disabled button.
 */
export function DownloadPanel() {
  const { state, validation, readability, needsCommit, committed, needsPublishing, user, authReady } =
    useQRWizard();
  const [format, setFormat] = React.useState<QRExportFormat>("png");
  const [size, setSize] = React.useState<PNGExportSize>(1024);
  const [downloading, setDownloading] = React.useState(false);

  const blockingReason = React.useMemo((): string | null => {
    if (!state.selectedType) return "Select a QR type first.";
    if (!validation.valid) return "The content is incomplete — fix the Add Content step.";
    if (!readability.isSafe) return "The design has readability errors — fix them in Design QR Code.";
    if (needsCommit && !committed) {
      if (authReady && !user) return "Sign in above to save and download your QR.";
      return needsPublishing
        ? state.slug
          ? "You have unsaved changes — save them above before downloading."
          : "Save your QR above — it encodes your hosted link."
        : "Save your QR to your account above to enable download.";
    }
    if (!state.generatedPayload) return "Nothing to encode yet.";
    return null;
  }, [state, validation.valid, readability.isSafe, needsCommit, committed, needsPublishing, user, authReady]);

  const disabled = blockingReason !== null || downloading;

  const handleDownload = async () => {
    if (blockingReason || !state.selectedType) return;
    setDownloading(true);
    try {
      const ok = await downloadQRCode({
        payload: state.generatedPayload,
        type: state.selectedType,
        design: state.design,
        format,
        size,
      });
      if (ok) {
        toast.success(`${format.toUpperCase()} downloaded`, {
          description:
            format === "png"
              ? `${size} × ${size} — test it with your phone.`
              : "Vector SVG — scales to any size.",
        });
      } else {
        toast.error("Couldn't generate the file. Please try again.");
      }
    } catch {
      toast.error("Couldn't generate the file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Format</legend>
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as QRExportFormat)}
          className="grid grid-cols-2 gap-2"
        >
          <Label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm hover:bg-secondary has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-accent">
            <RadioGroupItem value="png" />
            <span>
              PNG <span className="font-mono text-xs text-muted-foreground">raster</span>
            </span>
          </Label>
          <Label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm hover:bg-secondary has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-accent">
            <RadioGroupItem value="svg" />
            <span>
              SVG <span className="font-mono text-xs text-muted-foreground">vector</span>
            </span>
          </Label>
        </RadioGroup>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="qr-export-size">Size</Label>
        <Select value={String(size)} onValueChange={(v) => setSize(Number(v) as PNGExportSize)}>
          <SelectTrigger id="qr-export-size" className="w-full font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PNG_EXPORT_SIZES.map((s) => (
              <SelectItem key={s} value={String(s)} className="font-mono">
                {s} × {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {format === "svg" && (
          <p className="text-xs text-muted-foreground">
            SVG is vector — the size sets the viewBox; it scales losslessly to any size.
          </p>
        )}
      </div>

      {state.selectedType && !blockingReason && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
          <span className="truncate font-mono text-xs">{exportFileName(state.selectedType, format)}</span>
          <span className="ml-3 shrink-0 font-mono text-[11px] text-muted-foreground">
            {format === "png" ? `${size} × ${size}` : "vector"}
          </span>
        </div>
      )}

      <Button type="button" className="w-full" onClick={handleDownload} disabled={disabled}>
        {downloading ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            Preparing…
          </>
        ) : (
          <>
            <Download aria-hidden />
            Download {format.toUpperCase()}
          </>
        )}
      </Button>

      {blockingReason && (
        <p role="status" className="text-sm text-muted-foreground">
          {blockingReason}
        </p>
      )}
    </div>
  );
}
