"use client";

import * as React from "react";
import QRCodeStyling from "qr-code-styling";
import { buildQRStylingOptions } from "@/lib/qr/styling";
import type { QRDesignOptions } from "@/lib/qr/types";

/**
 * A real, tiny QR rendered through the SAME pipeline as every other
 * surface — preset tiles are truthful, not stock thumbnails. Fixed
 * short payload so tiles stay visually stable while the user types.
 */
const THUMB_PAYLOAD = "QRGATE";
const THUMB_SIZE = 96;

export const MiniQR = React.memo(function MiniQR({
  design,
  className,
}: {
  design: QRDesignOptions;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const qrRef = React.useRef<QRCodeStyling | null>(null);

  React.useEffect(() => {
    const options = buildQRStylingOptions(THUMB_PAYLOAD, design, THUMB_SIZE);
    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling(options);
      if (ref.current) {
        ref.current.innerHTML = "";
        qrRef.current.append(ref.current);
      }
    } else {
      qrRef.current.update(options);
    }
  }, [design]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none aspect-square w-full overflow-hidden rounded-md [&_canvas]:h-full [&_canvas]:w-full ${className ?? ""}`}
    />
  );
});
