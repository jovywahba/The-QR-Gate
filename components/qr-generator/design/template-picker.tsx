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
import { defaultDesign } from "@/lib/qr/defaults";
import {
  applyTemplate,
  qrTemplates,
  TEMPLATE_CATEGORIES,
  templateThumbnailDesign,
  type QRTemplate,
  type QRTemplateCategory,
} from "@/lib/qr/templates";
import type { QRDesignOptions } from "@/lib/qr/types";
import { cn } from "@/lib/utils";
import { useQRWizard } from "../use-qr-wizard";
import { MiniQR } from "./mini-qr";

/**
 * Pre-made templates. Each tile renders a REAL miniature QR through the
 * same pipeline as the export, and selecting one patches the real design
 * state exactly once — later manual edits are never overwritten.
 */

const FEATURED = 6;

/** "None" restores the plain default QR style (content, logo and frame untouched). */
const STYLE_RESET: Partial<QRDesignOptions> = {
  dotStyle: defaultDesign.dotStyle,
  cornerSquareStyle: defaultDesign.cornerSquareStyle,
  cornerDotStyle: defaultDesign.cornerDotStyle,
  foregroundColor: defaultDesign.foregroundColor,
  backgroundColor: defaultDesign.backgroundColor,
  gradientType: defaultDesign.gradientType,
  gradientStartColor: defaultDesign.gradientStartColor,
  gradientEndColor: defaultDesign.gradientEndColor,
  gradientRotation: defaultDesign.gradientRotation,
  margin: defaultDesign.margin,
  errorCorrection: defaultDesign.errorCorrection,
  templateId: null,
};

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

export function TemplatePicker() {
  const { state, patchDesign } = useQRWizard();
  const design = state.design;
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<QRTemplateCategory | "all">("all");

  const selectNone = () => patchDesign(STYLE_RESET);
  const select = (template: QRTemplate) => {
    patchDesign(applyTemplate(design, template));
    setOpen(false);
  };

  const featured = qrTemplates.slice(0, FEATURED);
  const remaining = qrTemplates.length - FEATURED;
  const visible = category === "all" ? qrTemplates : qrTemplates.filter((t) => t.category === category);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" role="group" aria-label="Pre-made templates">
        <Tile selected={!design.templateId} label="None" onClick={selectNone}>
          <MiniQR design={{ ...defaultDesign, frameId: "none", margin: 2 }} />
        </Tile>
        {featured.map((template) => (
          <Tile
            key={template.id}
            selected={design.templateId === template.id}
            label={template.name}
            onClick={() => select(template)}
          >
            <MiniQR design={templateThumbnailDesign(template)} />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>All templates</DialogTitle>
            <DialogDescription>
              Each preview is a real QR rendered with that template. Picking one only changes the design.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_CATEGORIES.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={category === c.id ? "default" : "outline"}
                onClick={() => setCategory(c.id as QRTemplateCategory | "all")}
              >
                {c.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {visible.map((template) => (
              <Tile
                key={template.id}
                selected={design.templateId === template.id}
                label={template.name}
                onClick={() => select(template)}
              >
                <MiniQR design={templateThumbnailDesign(template)} />
              </Tile>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
