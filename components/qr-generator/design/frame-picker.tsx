"use client";

import * as React from "react";
import { Check, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { artworkDimensions, frameColorsFor, frameThumbnailSvg } from "@/lib/qr/composition";
import { defaultDesign } from "@/lib/qr/defaults";
import {
  defaultFrameTextFor,
  FRAME_CATEGORIES,
  getFrame,
  MAX_FRAME_TEXT,
  normalizeFrameText,
  qrFrames,
  resolveFrameText,
  type QRFrame,
  type QRFrameCategory,
} from "@/lib/qr/frames";
import { readableTextOn } from "@/lib/qr/templates";
import type { QRDesignOptions, QRExportFit } from "@/lib/qr/types";
import { cn } from "@/lib/utils";
import { useQRWizard } from "../use-qr-wizard";
import { ColorField } from "./color-field";
import { StyleOptionGroup } from "./style-option-group";

/**
 * Frames wrap the REAL QR — they are composed into the artwork itself,
 * so every frame you pick here appears in the PNG and the vector SVG.
 * Tiles are lightweight SVG previews (no full QR raster per tile).
 */

const FEATURED = 5;

function FrameThumb({ svg }: { svg: string }) {
  return (
    <span
      aria-hidden
      className="block aspect-square w-full overflow-hidden rounded-md border bg-white [&_svg]:h-full [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Tile({
  selected,
  label,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative flex w-[78px] shrink-0 flex-col items-center gap-1.5 rounded-xl border bg-background p-1.5 transition-colors",
        "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        selected && "border-accent ring-1 ring-accent",
      )}
    >
      <span className="w-full">{children}</span>
      <span className="w-full truncate text-center text-[10px] font-medium">{label}</span>
      {selected && (
        <Check className="absolute top-1 right-1 size-4 rounded-full bg-accent p-0.5 text-accent-foreground" aria-hidden />
      )}
    </button>
  );
}

export function FramePicker() {
  const { state, patchDesign } = useQRWizard();
  const design = state.design;
  const type = state.selectedType;
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<QRFrameCategory | "all">("all");

  const frame = getFrame(design.frameId);
  const colors = frameColorsFor(design);
  const qrColor = design.gradientType === "none" ? design.foregroundColor : design.gradientStartColor;

  const thumbFor = React.useCallback(
    (f: QRFrame) =>
      frameThumbnailSvg({
        frameId: f.id,
        colors,
        text: resolveFrameText(f, design.frameText, type),
        qrColor,
      }),
    [colors, design.frameText, type, qrColor],
  );

  const select = (next: QRFrame) => {
    const patch: Partial<QRDesignOptions> = { frameId: next.id };
    // First frame → derive a palette from the QR so the two read as one design.
    if (design.frameId === "none" && next.id !== "none") {
      patch.frameBackground = design.backgroundColor;
      patch.frameForeground = qrColor;
      patch.frameTextColor = readableTextOn(qrColor);
    }
    // Suggest the CTA for this QR type; the user can always edit it.
    if (next.hasText && !design.frameText.trim()) {
      patch.frameText = defaultFrameTextFor(type);
    }
    patchDesign(patch);
    setOpen(false);
  };

  const featured = qrFrames.slice(0, FEATURED + 1); // includes "none"
  const remaining = qrFrames.length - featured.length;
  const visible = category === "all" ? qrFrames : qrFrames.filter((f) => f.category === category);
  const dims = artworkDimensions(design, 1024, type);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" role="group" aria-label="Frames">
        {featured.map((f) => (
          <Tile key={f.id} selected={design.frameId === f.id} label={f.name} onClick={() => select(f)}>
            <FrameThumb svg={thumbFor(f)} />
          </Tile>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-[78px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-background p-1.5 text-muted-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <LayoutGrid className="size-5" aria-hidden />
            <span className="text-[10px] font-medium">+{remaining} more</span>
          </button>
        )}
      </div>

      {frame.id !== "none" && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          {frame.hasText && (
            <div className="space-y-1.5">
              <Label htmlFor="qr-frame-text">Frame text</Label>
              <Input
                id="qr-frame-text"
                value={design.frameText}
                maxLength={MAX_FRAME_TEXT}
                placeholder={defaultFrameTextFor(type)}
                onChange={(e) => patchDesign({ frameText: normalizeFrameText(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                {design.frameText.length}/{MAX_FRAME_TEXT} — shown inside the exported artwork.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <ColorField
              id="qr-frame-background"
              label="Frame background"
              value={design.frameBackground}
              defaultValue={defaultDesign.frameBackground}
              onChange={(frameBackground) => patchDesign({ frameBackground })}
            />
            <ColorField
              id="qr-frame-foreground"
              label="Frame color"
              value={design.frameForeground}
              defaultValue={defaultDesign.frameForeground}
              onChange={(frameForeground) => patchDesign({ frameForeground })}
            />
            {frame.hasText && (
              <ColorField
                id="qr-frame-text-color"
                label="Frame text color"
                value={design.frameTextColor}
                defaultValue={defaultDesign.frameTextColor}
                onChange={(frameTextColor) => patchDesign({ frameTextColor })}
              />
            )}
          </div>

          <StyleOptionGroup
            legend="Export size"
            value={design.exportFit}
            options={[
              { value: "square" as QRExportFit, label: "Square" },
              { value: "frame" as QRExportFit, label: "Fit frame" },
            ]}
            onChange={(exportFit) => patchDesign({ exportFit })}
          />
          <p className="font-mono text-xs text-muted-foreground">
            1024 export → {dims.width} × {dims.height} px
            {design.exportFit === "square"
              ? " — the whole frame fits the square."
              : " — the frame extends the canvas."}
          </p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>All frames</DialogTitle>
            <DialogDescription>
              Frames are composed into the real artwork — they export with your PNG and SVG.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5">
            {FRAME_CATEGORIES.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={category === c.id ? "default" : "outline"}
                onClick={() => setCategory(c.id as QRFrameCategory | "all")}
              >
                {c.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {visible.map((f) => (
              <Tile key={f.id} selected={design.frameId === f.id} label={f.name} onClick={() => select(f)}>
                <FrameThumb svg={thumbFor(f)} />
              </Tile>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
