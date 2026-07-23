"use client";

import * as React from "react";
import { QrCode } from "lucide-react";
import { composeArtworkCanvas } from "@/lib/qr/composition";
import type { QRDesignOptions, QRType } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

/**
 * The live QR renderer. Real codes only — when the payload is empty
 * (invalid/incomplete content) it shows an honest empty state, never
 * a placeholder pattern.
 *
 * It renders the SAME composed artwork the export produces (QR + frame
 * + CTA) through lib/qr/composition, so the preview is a true
 * what-you-see-is-what-you-download. Canvas work touches the DOM, so
 * this component is loaded with `next/dynamic` + `ssr: false`.
 */

export type QRRendererProps = {
  payload: string;
  /** Internal render resolution (canvas px). Display size comes from className. */
  size?: number;
  design: QRDesignOptions;
  /** Resolves the default CTA text for frames when the user typed none. */
  type?: QRType | null;
  /** Shown in the empty state — tell the user what's missing. */
  emptyHint?: string;
  className?: string;
};

const RENDER_DEBOUNCE_MS = 120;

export default function QRRenderer({
  payload,
  size = 640,
  design,
  type,
  emptyHint = "Fill in the required fields and your QR code will appear here.",
  className,
}: QRRendererProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!payload) {
      // Tear down so an invalid edit can't keep showing a stale (wrong) code.
      if (containerRef.current) containerRef.current.innerHTML = "";
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      composeArtworkCanvas({ payload, design, size, type })
        .then((canvas) => {
          if (cancelled || !containerRef.current) return;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(canvas);
        })
        .catch(() => {
          /* a transient render failure keeps the last good artwork */
        });
    }, RENDER_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [payload, design, size, type]);

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
      className={cn("w-full overflow-hidden rounded-lg border bg-white p-2", className)}
    />
  );
}
