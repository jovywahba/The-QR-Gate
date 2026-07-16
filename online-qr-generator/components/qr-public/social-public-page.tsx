import { normalizeUrl } from "@/lib/qr/payloads";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/qr/social";
import type { SocialContent } from "@/lib/qr/types";
import type { AssetResolver } from "./resolver";
import { EmptyHint, PageAvatar, SOCIAL_ICONS } from "./shared";

export function SocialPublicPage({ data, resolveAsset }: { data: SocialContent; resolveAsset: AssetResolver }) {
  const links = data.links.filter((l) => normalizeUrl(l.url));

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <PageAvatar url={resolveAsset(data.image)} alt="" fallback={data.title || "S"} size="lg" />
        <h1 className="text-xl font-semibold tracking-tight">{data.title.trim() || "Follow us"}</h1>
        {data.description.trim() && (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        )}
      </div>

      {links.length === 0 ? (
        <EmptyHint>Add social channels and they appear here.</EmptyHint>
      ) : (
        <ul className="space-y-2">
          {links.map((item) => {
            const Icon = SOCIAL_ICONS[item.platform];
            return (
              <li key={item.id}>
                <a
                  href={normalizeUrl(item.url)!}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-full items-center gap-3 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{item.label.trim() || SOCIAL_PLATFORM_LABELS[item.platform]}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
