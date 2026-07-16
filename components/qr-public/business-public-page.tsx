import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { normalizeUrl } from "@/lib/qr/payloads";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/qr/social";
import type { BusinessContent, WeekDay } from "@/lib/qr/types";
import type { AssetResolver } from "./resolver";
import { ActionLink, PageAvatar, SOCIAL_ICONS } from "./shared";

const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export function BusinessPublicPage({ data, resolveAsset }: { data: BusinessContent; resolveAsset: AssetResolver }) {
  const coverUrl = resolveAsset(data.cover);
  const address = [data.street.trim(), data.city.trim(), data.country.trim()].filter(Boolean).join(", ");
  const mapUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
  const website = data.website.trim() ? normalizeUrl(data.website) : null;
  const ctaUrl = data.ctaLabel.trim() && data.ctaUrl.trim() ? normalizeUrl(data.ctaUrl) : null;
  const socials = data.socials.filter((s) => normalizeUrl(s.url));
  const hasHours = data.hours.some((h) => !h.closed);

  return (
    <div className="space-y-4">
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="h-32 w-full rounded-lg border object-cover" />
      )}

      <div className="flex items-center gap-3">
        <PageAvatar url={resolveAsset(data.logo)} alt="" fallback={data.name || "B"} />
        <div className="min-w-0">
          {data.category.trim() && (
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {data.category}
            </p>
          )}
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {data.name.trim() || "Business name"}
          </h1>
        </div>
      </div>

      {data.headline.trim() && <p className="text-sm font-medium">{data.headline}</p>}
      {data.description.trim() && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{data.description}</p>
      )}

      {ctaUrl && <ActionLink href={ctaUrl}>{data.ctaLabel}</ActionLink>}

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
        {website && (
          <ActionLink href={website} variant="outline">
            <Globe className="size-4" aria-hidden />
            Website
          </ActionLink>
        )}
        {mapUrl && (
          <ActionLink href={mapUrl} variant="outline">
            <MapPin className="size-4" aria-hidden />
            Map
          </ActionLink>
        )}
      </div>

      {address && <p className="text-center text-xs text-muted-foreground">{address}</p>}

      {hasHours && (
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            <Clock className="size-3" aria-hidden />
            Opening hours
          </p>
          <dl className="space-y-1">
            {data.hours.map((row) => (
              <div key={row.day} className="flex items-center justify-between text-sm">
                <dt className="text-muted-foreground">{DAY_LABELS[row.day]}</dt>
                <dd className="font-mono text-xs">
                  {row.closed ? "Closed" : `${row.opens} – ${row.closes}`}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {socials.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {socials.map((item) => {
            const Icon = SOCIAL_ICONS[item.platform];
            return (
              <a
                key={item.id}
                href={normalizeUrl(item.url)!}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label.trim() || SOCIAL_PLATFORM_LABELS[item.platform]}
                className="flex size-10 items-center justify-center rounded-full border bg-card transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                <Icon className="size-4" aria-hidden />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
