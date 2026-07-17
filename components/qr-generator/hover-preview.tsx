"use client";

import * as React from "react";
import type { QRType } from "@/lib/qr/types";

/**
 * ───────────────────────────────────────────────────────────────
 * Hover-preview state for Step 1.
 *
 * Split into two contexts on purpose: the SETTER is stable (a
 * useState dispatch), so the 16 type cards can drive the preview
 * without re-rendering when the hovered value changes. Only the
 * preview panel subscribes to the VALUE.
 * ───────────────────────────────────────────────────────────────
 */

const HoverValueContext = React.createContext<QRType | null>(null);
const HoverSetContext = React.createContext<(type: QRType | null) => void>(() => {});

export function HoverPreviewProvider({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = React.useState<QRType | null>(null);
  return (
    <HoverSetContext.Provider value={setHovered}>
      <HoverValueContext.Provider value={hovered}>{children}</HoverValueContext.Provider>
    </HoverSetContext.Provider>
  );
}

/** The currently hovered/focused QR type (preview panel reads this). */
export function useHoveredType(): QRType | null {
  return React.useContext(HoverValueContext);
}

/** Stable setter (cards write this; reading it never triggers a re-render). */
export function useSetHoveredType(): (type: QRType | null) => void {
  return React.useContext(HoverSetContext);
}
