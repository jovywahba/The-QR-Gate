import { Mail, MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { normalizeUrl } from "@/lib/qr/payloads";
import type { MenuContent } from "@/lib/qr/types";
import type { AssetResolver } from "./resolver";
import { ActionLink, EmptyHint, PageAvatar } from "./shared";

export function MenuPublicPage({ data, resolveAsset }: { data: MenuContent; resolveAsset: AssetResolver }) {
  const menuUrl =
    data.mode === "pdf" ? resolveAsset(data.file) : data.menuUrl.trim() ? normalizeUrl(data.menuUrl) : null;
  const mapUrl = data.address.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address.trim())}`
    : null;
  const ctaUrl = data.ctaLabel.trim() && data.ctaUrl.trim() ? normalizeUrl(data.ctaUrl) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <PageAvatar url={resolveAsset(data.logo)} alt="" fallback={data.businessName || "M"} size="lg" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {data.businessName.trim() || data.menuTitle.trim() || "Menu"}
          </h1>
          {data.businessName.trim() && data.menuTitle.trim() && (
            <p className="text-sm text-muted-foreground">{data.menuTitle}</p>
          )}
        </div>
        {data.description.trim() && (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        )}
      </div>

      {menuUrl ? (
        <ActionLink href={menuUrl}>
          <UtensilsCrossed className="size-4" aria-hidden />
          View menu
        </ActionLink>
      ) : (
        <EmptyHint>Upload a menu PDF or add a menu URL and it appears here.</EmptyHint>
      )}

      {ctaUrl && <ActionLink href={ctaUrl} variant="outline">{data.ctaLabel}</ActionLink>}

      <div className="grid grid-cols-2 gap-2">
        {data.phone.trim() && (
          <ActionLink href={`tel:${data.phone.replace(/[^\d+]/g, "")}`} variant="outline">
            <Phone className="size-4" aria-hidden />
            Call
          </ActionLink>
        )}
        {data.email.trim() && (
          <ActionLink href={`mailto:${data.email.trim()}`} variant="outline">
            <Mail className="size-4" aria-hidden />
            Email
          </ActionLink>
        )}
      </div>

      {mapUrl && (
        <ActionLink href={mapUrl} variant="outline">
          <MapPin className="size-4" aria-hidden />
          {data.address}
        </ActionLink>
      )}
    </div>
  );
}
