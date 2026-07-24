"use client";

import * as React from "react";
import Link from "next/link";
import { FilePlus2, PencilLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultContentFor } from "@/lib/qr/defaults";
import { loadDraft } from "@/lib/qr/persistence";
import { getQRType, isQRType } from "@/lib/qr/registry";

/**
 * If the visitor left an unfinished QR in this tab's sessionStorage, offer
 * to resume it OR start fresh — so clicking "Create QR Code" from the
 * dashboard never silently reopens (or overwrites) their previous work.
 * Renders nothing on the server / until it has read the draft.
 */
type Resumable = { type: string; typeName: string; step: number } | null;

export function DraftResumeBanner() {
  const [draft, setDraft] = React.useState<Resumable>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const d = loadDraft();
    if (
      !d ||
      !d.selectedType ||
      !isQRType(d.selectedType) ||
      !d.content ||
      d.publishingStatus === "published"
    ) {
      return;
    }
    // Only nag when there's actual unsaved work (content diverges from the default).
    const isDirty =
      JSON.stringify(d.content) !== JSON.stringify(defaultContentFor(d.selectedType));
    if (!isDirty) return;
    setDraft({
      type: d.selectedType,
      typeName: getQRType(d.selectedType).name,
      step: d.step >= 2 ? d.step : 2,
    });
  }, []);

  if (!draft || dismissed) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
      <p className="text-sm">
        <span className="font-medium">You have an unfinished {draft.typeName} QR.</span>{" "}
        <span className="text-muted-foreground">Pick up where you left off, or start a new one.</span>
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/create?type=${draft.type}&step=${draft.step}`}>
            <PencilLine aria-hidden />
            Continue draft
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/create?new=1">
            <FilePlus2 aria-hidden />
            Start new
          </Link>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}
