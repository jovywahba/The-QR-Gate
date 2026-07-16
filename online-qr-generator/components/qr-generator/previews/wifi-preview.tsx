"use client";

import { EyeOff, Lock, Wifi } from "lucide-react";
import type { WiFiContent } from "@/lib/qr/types";

const ENCRYPTION_LABELS: Record<WiFiContent["encryption"], string> = {
  WPA: "WPA/WPA2",
  WEP: "WEP",
  nopass: "Open network",
};

/** Accurate destination summary — scanning offers to join this network. */
export function WiFiPreview({ data }: { data: WiFiContent }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted" aria-hidden>
          <Wifi className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.ssid.trim() || "Network name"}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden />
            {ENCRYPTION_LABELS[data.encryption]}
            {data.hidden && (
              <span className="inline-flex items-center gap-1">
                · <EyeOff className="size-3" aria-hidden /> hidden
              </span>
            )}
          </p>
        </div>
      </div>
      {data.encryption !== "nopass" && (
        <div className="rounded-lg border bg-card p-3">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Password</p>
          <p className="mt-1 font-mono text-sm" aria-label={data.password ? "Password entered (hidden)" : "No password yet"}>
            {data.password ? "•".repeat(Math.min(data.password.length, 16)) : "—"}
          </p>
        </div>
      )}
      <p className="px-1 text-xs text-muted-foreground">
        Scanning prompts the phone to join this network automatically.
      </p>
    </div>
  );
}
