"use client";

import { Instagram } from "lucide-react";
import { ActionLink } from "@/components/qr-public/shared";
import { normalizeInstagramInput } from "@/lib/qr/payloads";
import type { InstagramContent } from "@/lib/qr/types";

/** Direct QR — an accurate destination summary (no hosted page). */
export function InstagramPreview({ data }: { data: InstagramContent }) {
  const url = normalizeInstagramInput(data.handle);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted" aria-hidden>
          <Instagram className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.title.trim() || "Instagram profile"}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{url ?? "Add your username"}</p>
        </div>
      </div>
      {data.description.trim() && (
        <p className="px-1 text-xs leading-relaxed text-muted-foreground">{data.description}</p>
      )}
      {url && <ActionLink href={url}>Open profile</ActionLink>}
      <p className="px-1 text-xs text-muted-foreground">
        Scanning opens this Instagram profile directly — no landing page in between.
      </p>
    </div>
  );
}
