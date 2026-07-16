"use client";

import { Globe } from "lucide-react";
import { normalizeUrl } from "@/lib/qr/payloads";
import type { WebsiteContent } from "@/lib/qr/types";

/** Accurate destination summary — scanning this QR opens the URL below. */
export function WebsitePreview({ data }: { data: WebsiteContent }) {
  const url = normalizeUrl(data.url);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
        <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate font-mono text-xs">
          {url ?? "https://…"}
        </span>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-semibold">{data.title?.trim() || "Untitled page"}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {data.description?.trim() || "Scanning opens this link directly in the phone's browser."}
        </p>
      </div>
    </div>
  );
}
