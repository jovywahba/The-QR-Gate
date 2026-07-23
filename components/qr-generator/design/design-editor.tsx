"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { defaultDesign } from "@/lib/qr/defaults";
import { getFrame } from "@/lib/qr/frames";
import { MAX_MARGIN, MIN_MARGIN, RECOMMENDED_MARGIN } from "@/lib/qr/readability";
import { getTemplate, isTemplateModified } from "@/lib/qr/templates";
import type {
  QRCornerDotStyle,
  QRCornerSquareStyle,
  QRDotStyle,
  QRErrorCorrection,
  QRGradientType,
} from "@/lib/qr/types";
import { useQRWizard } from "../use-qr-wizard";
import { ColorField } from "./color-field";
import { DesignSection } from "./design-section";
import { EnlargePreview } from "./enlarge-preview";
import { FramePicker } from "./frame-picker";
import { LogoSection } from "./logo-section";
import { ReadabilityPanel } from "./readability-panel";
import { RangeField, StyleOptionGroup } from "./style-option-group";
import { TemplatePicker } from "./template-picker";

/**
 * Step 3 — the real design editor. Every control writes into the one
 * design state that feeds the single rendering pipeline (preview,
 * thumbnails, Step 4, PNG export).
 */

const DOT_STYLES: ReadonlyArray<{ value: QRDotStyle; label: string }> = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "extra-rounded", label: "Extra Rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy Rounded" },
];

const CORNER_SQUARE_STYLES: ReadonlyArray<{ value: QRCornerSquareStyle; label: string }> = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "rounded", label: "Rounded" },
  { value: "extra-rounded", label: "Extra Rounded" },
];

const CORNER_DOT_STYLES: ReadonlyArray<{ value: QRCornerDotStyle; label: string }> = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "rounded", label: "Rounded" },
];

const EC_OPTIONS: ReadonlyArray<{ value: QRErrorCorrection; label: string }> = [
  { value: "L", label: "L — Low" },
  { value: "M", label: "M — Medium" },
  { value: "Q", label: "Q — High" },
  { value: "H", label: "H — Maximum" },
];

const GRADIENT_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315] as const;

function ResetDesignButton() {
  const { state, resetDesign } = useQRWizard();
  const isDirty = React.useMemo(
    () => JSON.stringify(state.design) !== JSON.stringify(defaultDesign),
    [state.design],
  );

  if (!isDirty) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={resetDesign}>
        <RotateCcw aria-hidden />
        Reset design
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <RotateCcw aria-hidden />
          Reset design
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset the design?</AlertDialogTitle>
          <AlertDialogDescription>
            Style, colors, gradient, logo, margin, and error correction go back to the defaults.
            Your QR content is not touched.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep my design</AlertDialogCancel>
          <AlertDialogAction onClick={resetDesign}>Reset design</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DesignEditor() {
  const { state, patchDesign } = useQRWizard();
  const design = state.design;

  const template = getTemplate(design.templateId);
  const templateMeta = template
    ? `${template.name}${isTemplateModified(design) ? " — modified" : ""}`
    : "None";
  const frameMeta = getFrame(design.frameId).name;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <EnlargePreview />
        <ResetDesignButton />
      </div>

      <DesignSection title="Pre-made templates" defaultOpen meta={templateMeta}>
        <TemplatePicker />
        <p className="text-xs text-muted-foreground">
          Templates change the design only — never your content or destination. They&apos;re a starting
          point: everything stays editable afterwards.
        </p>
      </DesignSection>

      <DesignSection title="Frames" defaultOpen meta={frameMeta}>
        <FramePicker />
        <p className="text-xs text-muted-foreground">
          The frame is part of the real artwork — it exports with your PNG and vector SVG.
        </p>
      </DesignSection>

      <DesignSection title="Pattern" defaultOpen meta={design.dotStyle}>
        <StyleOptionGroup
          legend="Body pattern"
          value={design.dotStyle}
          options={DOT_STYLES}
          onChange={(dotStyle) => patchDesign({ dotStyle })}
        />
      </DesignSection>

      <DesignSection title="Corners" meta={`${design.cornerSquareStyle} · ${design.cornerDotStyle}`}>
        <StyleOptionGroup
          legend="Corner squares"
          value={design.cornerSquareStyle}
          options={CORNER_SQUARE_STYLES}
          onChange={(cornerSquareStyle) => patchDesign({ cornerSquareStyle })}
        />
        <StyleOptionGroup
          legend="Corner dots"
          value={design.cornerDotStyle}
          options={CORNER_DOT_STYLES}
          onChange={(cornerDotStyle) => patchDesign({ cornerDotStyle })}
        />
      </DesignSection>

      <DesignSection
        title="Colors"
        defaultOpen
        meta={
          design.gradientType === "none"
            ? design.foregroundColor
            : `${design.gradientType} gradient`
        }
      >
        {design.gradientType === "none" && (
          <ColorField
            id="qr-design-foreground"
            label="Foreground"
            value={design.foregroundColor}
            defaultValue={defaultDesign.foregroundColor}
            onChange={(foregroundColor) => patchDesign({ foregroundColor })}
          />
        )}
        <ColorField
          id="qr-design-background"
          label="Background"
          value={design.backgroundColor}
          defaultValue={defaultDesign.backgroundColor}
          onChange={(backgroundColor) => patchDesign({ backgroundColor })}
        />

        <StyleOptionGroup
          legend="Gradient"
          value={design.gradientType}
          options={[
            { value: "none" as QRGradientType, label: "None" },
            { value: "linear" as QRGradientType, label: "Linear" },
            { value: "radial" as QRGradientType, label: "Radial" },
          ]}
          onChange={(gradientType) => patchDesign({ gradientType })}
        />

        {design.gradientType !== "none" && (
          <>
            <ColorField
              id="qr-design-gradient-start"
              label="Gradient start"
              value={design.gradientStartColor}
              defaultValue={defaultDesign.gradientStartColor}
              onChange={(gradientStartColor) => patchDesign({ gradientStartColor })}
            />
            <ColorField
              id="qr-design-gradient-end"
              label="Gradient end"
              value={design.gradientEndColor}
              defaultValue={defaultDesign.gradientEndColor}
              onChange={(gradientEndColor) => patchDesign({ gradientEndColor })}
            />
            {design.gradientType === "linear" && (
              <div className="space-y-1.5">
                <Label htmlFor="qr-design-gradient-rotation">Direction</Label>
                <Select
                  value={String(design.gradientRotation)}
                  onValueChange={(v) => patchDesign({ gradientRotation: Number(v) })}
                >
                  <SelectTrigger id="qr-design-gradient-rotation" className="w-full font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADIENT_ROTATIONS.map((deg) => (
                      <SelectItem key={deg} value={String(deg)} className="font-mono">
                        {deg}°
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </DesignSection>

      <DesignSection title="Logo" meta={design.logoDataUrl ? (design.logoFileName ?? "added") : "none"}>
        <LogoSection />
      </DesignSection>

      <DesignSection title="Error correction" meta={design.errorCorrection}>
        <StyleOptionGroup
          legend="Error correction level"
          value={design.errorCorrection}
          options={EC_OPTIONS}
          columns={2}
          onChange={(errorCorrection) => patchDesign({ errorCorrection })}
        />
        <p className="text-xs text-muted-foreground">
          Higher error correction makes the QR more resilient but increases its visual density.
          {design.logoDataUrl && " A logo requires H."}
        </p>
      </DesignSection>

      <DesignSection title="Size & margin" meta={`margin ${design.margin}%`}>
        <RangeField
          id="qr-design-margin"
          label="Quiet zone (margin)"
          value={design.margin}
          min={MIN_MARGIN}
          max={MAX_MARGIN}
          unit="%"
          onChange={(margin) => patchDesign({ margin })}
          hint={
            design.margin < RECOMMENDED_MARGIN
              ? "A larger clear margin helps phones detect the QR code."
              : "Applied to the exported file too — not just the preview."
          }
        />
      </DesignSection>

      <ReadabilityPanel />
    </div>
  );
}
