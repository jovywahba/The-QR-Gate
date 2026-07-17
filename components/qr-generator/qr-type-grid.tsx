"use client";

import * as React from "react";
import { QR_TYPES } from "@/lib/qr/registry";
import { useSetHoveredType } from "./hover-preview";
import { QRTypeCard } from "./qr-type-card";
import { useQRWizard } from "./use-qr-wizard";

/**
 * Step 1 — the 16-type grid. 1 col at 320px, 2 from small phones,
 * 3 at lg, 4 on wide desktops. Never overflows horizontally.
 *
 * Hovering/focusing a card previews that type in the mobile preview
 * panel (via the stable hover setter — the cards never re-render on
 * hover changes). Clicking still selects and advances to Step 2.
 */
export function QRTypeGrid() {
  const { state, selectType } = useQRWizard();
  const setHovered = useSetHoveredType();

  return (
    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {QR_TYPES.map((definition) => (
        <QRTypeCard
          key={definition.id}
          definition={definition}
          selected={state.selectedType === definition.id}
          onSelect={() => selectType(definition.id)}
          onPreview={() => setHovered(definition.id)}
          onPreviewEnd={() => setHovered(null)}
        />
      ))}
    </div>
  );
}
