"use client";

import { Facebook } from "lucide-react";
import { normalizeFacebookUrl } from "@/lib/qr/payloads";
import type { FacebookContent } from "@/lib/qr/types";

/** Direct QR — an accurate destination summary (no hosted page). */
export function FacebookPreview({ data }: { data: FacebookContent }) {
  const url = normalizeFacebookUrl(data.url);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted" aria-hidden>
          <Facebook className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.pageName.trim() || "Facebook page"}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{url ?? "Add your page URL"}</p>
        </div>
      </div>
      {data.description.trim() && (
        <p className="px-1 text-xs leading-relaxed text-muted-foreground">{data.description}</p>
      )}
      <p className="px-1 text-xs text-muted-foreground">
        Scanning opens this Facebook page directly — no landing page in between.
      </p>
    </div>
  );
}
