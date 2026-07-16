import { Link as LinkFallbackIcon } from "lucide-react";
import { normalizeUrl } from "@/lib/qr/payloads";
import type { LinksContent } from "@/lib/qr/types";
import type { AssetResolver } from "./resolver";
import { EmptyHint, LINK_ICONS, PageAvatar } from "./shared";

export function LinksPublicPage({ data, resolveAsset }: { data: LinksContent; resolveAsset: AssetResolver }) {
  const links = data.links.filter((l) => l.label.trim() && normalizeUrl(l.url));

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <PageAvatar url={resolveAsset(data.image)} alt="" fallback={data.title} size="lg" />
        <h1 className="text-xl font-semibold tracking-tight">{data.title.trim() || "Links"}</h1>
        {data.description.trim() && (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        )}
      </div>

      {links.length === 0 ? (
        <EmptyHint>Add links and they appear here as buttons.</EmptyHint>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = LINK_ICONS[link.icon] ?? LinkFallbackIcon;
            return (
              <li key={link.id}>
                <a
                  href={normalizeUrl(link.url)!}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-full items-center gap-3 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{link.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
