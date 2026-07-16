"use client";

import * as React from "react";
import QRCodeStyling from "qr-code-styling";
import { QrCode } from "lucide-react";
import { buildQRStylingOptions } from "@/lib/qr/styling";
import type { QRDesignOptions } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

/**
 * The live QR renderer. Real codes only — when the payload is empty
 * (invalid/incomplete content) it shows an honest empty state, never
 * a placeholder pattern.
 *
 * qr-code-styling touches the DOM, so this component is loaded with
 * `next/dynamic` + `ssr: false` (see qr-preview-panel.tsx).
 */

export type QRRendererProps = {
  payload: string;
  /** Internal render resolution (canvas px). Display size comes from className. */
  size?: number;
  design: QRDesignOptions;
  /** Shown in the empty state — tell the user what's missing. */
  emptyHint?: string;
  className?: string;
};

const RENDER_DEBOUNCE_MS = 120;

export default function QRRenderer({
  payload,
  size = 640,
  design,
  emptyHint = "Fill in the required fields and your QR code will appear here.",
  className,
}: QRRendererProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const qrRef = React.useRef<QRCodeStyling | null>(null);

  React.useEffect(() => {
    if (!payload) {
      // Tear down so an invalid edit can't keep showing a stale (wrong) code.
      qrRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
      return;
    }
    const timer = window.setTimeout(() => {
      const options = buildQRStylingOptions(payload, design, size);
      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling(options);
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          qrRef.current.append(containerRef.current);
        }
      } else {
        qrRef.current.update(options);
      }
    }, RENDER_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [payload, design, size]);

  if (!payload) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/40 p-6 text-center",
          className,
        )}
      >
        <QrCode className="size-8 text-muted-foreground/60" aria-hidden />
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Generated QR code"
      className={cn(
        "aspect-square w-full overflow-hidden rounded-lg border bg-white p-2",
        "[&_canvas]:h-full [&_canvas]:w-full",
        className,
      )}
    />
  );
}
