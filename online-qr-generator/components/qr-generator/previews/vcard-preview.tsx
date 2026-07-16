"use client";

import { AtSign, Building2, Globe, MapPin, Phone, Smartphone } from "lucide-react";
import { normalizeUrl } from "@/lib/qr/payloads";
import type { VCardContent } from "@/lib/qr/types";

/** Accurate destination summary — scanning imports this contact card. */
export function VCardPreview({ data }: { data: VCardContent }) {
  const name = [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(" ");
  const initials =
    (data.firstName.trim()[0] ?? "") + (data.lastName.trim()[0] ?? "") || "?";
  const roleLine = [data.jobTitle?.trim(), data.company?.trim()].filter(Boolean).join(" · ");
  const address = [data.street?.trim(), data.city?.trim(), data.country?.trim()]
    .filter(Boolean)
    .join(", ");

  const rows: Array<{ icon: React.ElementType; label: string; value: string; mono?: boolean }> = [
    { icon: Smartphone, label: "Mobile", value: data.mobile?.trim() ?? "", mono: true },
    { icon: Phone, label: "Phone", value: data.phone?.trim() ?? "", mono: true },
    { icon: AtSign, label: "Email", value: data.email?.trim() ?? "", mono: true },
    { icon: Globe, label: "Website", value: data.website?.trim() ? (normalizeUrl(data.website) ?? "") : "", mono: true },
    { icon: MapPin, label: "Address", value: address },
  ].filter((row) => row.value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-primary font-mono text-sm text-primary-foreground uppercase"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name || "Contact name"}</p>
          {roleLine ? (
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{roleLine}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Saved to contacts on scan</p>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="divide-y rounded-lg border bg-card">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2.5 p-2.5">
              <row.icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  {row.label}
                </p>
                <p className={`truncate text-xs ${row.mono ? "font-mono" : ""}`}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.note?.trim() && (
        <div className="rounded-lg border bg-card p-3">
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Note</p>
          <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap">{data.note}</p>
        </div>
      )}
    </div>
  );
}
