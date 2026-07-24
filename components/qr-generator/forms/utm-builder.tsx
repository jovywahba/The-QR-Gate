"use client";

import * as React from "react";
import { ChevronDown, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildUrlWithUtm, hasUtm, parseUtm, UTM_KEYS, UTM_LABELS } from "@/lib/qr/utm";
import { cn } from "@/lib/utils";

/**
 * Collapsible UTM campaign builder for URL-based QR types. Derives its
 * fields from the current URL (single source of truth) and writes the
 * merged URL straight back — so what the QR encodes always matches what
 * you see. Existing query params and the fragment are preserved.
 */
const PLACEHOLDER: Partial<Record<(typeof UTM_KEYS)[number], string>> = {
  source: "qr, newsletter, flyer",
  medium: "print, qr, social",
  campaign: "spring_sale",
  term: "running+shoes",
  content: "poster_v2",
};

export function UtmBuilder({ url, onUrlChange }: { url: string; onUrlChange: (u: string) => void }) {
  const { base, utm } = parseUtm(url);
  const on = hasUtm(utm);
  const [open, setOpen] = React.useState(on);

  const setKey = (k: (typeof UTM_KEYS)[number], v: string) =>
    onUrlChange(buildUrlWithUtm(base, { ...utm, [k]: v }));

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm hover:bg-muted/40"
      >
        <span className="flex items-center gap-2 font-medium">
          <Tag className="size-4 text-muted-foreground" aria-hidden />
          Campaign tracking (UTM)
          {on ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent">
              on
            </span>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">optional</span>
          )}
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open ? (
        <div className="space-y-3 border-t p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {UTM_KEYS.map((k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <Label htmlFor={`utm-${k}`}>{UTM_LABELS[k]}</Label>
                <Input
                  id={`utm-${k}`}
                  value={utm[k] ?? ""}
                  onChange={(e) => setKey(k, e.target.value)}
                  placeholder={PLACEHOLDER[k] ?? ""}
                />
              </div>
            ))}
          </div>
          <p className="break-all text-xs text-muted-foreground">
            Final URL: <span className="font-mono text-foreground">{url || "—"}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
