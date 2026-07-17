"use client";

import * as React from "react";
import { ExternalLink, Globe, LoaderCircle } from "lucide-react";
import { normalizeUrl } from "@/lib/qr/payloads";
import type { WebsiteContent } from "@/lib/qr/types";
import { Body, PrimaryBtn } from "./kit";
import { useUrlMetadata } from "./use-preview-fetch";

/**
 * Website preview. Renders the real site in a sandboxed iframe when
 * the server confirms it permits framing; otherwise shows the real
 * fetched metadata (title / domain / description / OG image / favicon)
 * with a working Open button. Never invents page sections.
 */
export function WebsiteFrame({ data }: { data: WebsiteContent }) {
  const normalized = normalizeUrl(data.url);
  const { data: meta, loading } = useUrlMetadata(normalized);
  const [iframeFailed, setIframeFailed] = React.useState(false);

  React.useEffect(() => setIframeFailed(false), [normalized]);

  if (!normalized) {
    return (
      <Body top className="flex min-h-full flex-col items-center justify-center text-center">
        <Globe className="size-8 text-muted-foreground/50" aria-hidden />
        <p className="text-xs text-muted-foreground">Enter a website URL to preview it here.</p>
      </Body>
    );
  }

  const domain = meta?.domain ?? new URL(normalized).hostname.replace(/^www\./, "");
  const canEmbed = meta?.embeddable && !iframeFailed;

  return (
    <div className="flex min-h-full flex-col">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 pt-10 pb-2">
        {meta?.favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.favicon} alt="" className="size-3.5" />
        ) : (
          <Globe className="size-3.5 text-muted-foreground" aria-hidden />
        )}
        <span className="truncate font-mono text-[11px] text-muted-foreground">{domain}</span>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : canEmbed ? (
        <iframe
          key={normalized}
          src={normalized}
          title={meta?.title ?? domain}
          className="min-h-[300px] w-full flex-1 border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
          onError={() => setIframeFailed(true)}
        />
      ) : (
        // Real metadata card fallback.
        <div className="flex-1">
          {meta?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.image} alt="" className="h-32 w-full object-cover" />
          )}
          <Body>
            <p className="text-sm leading-snug font-semibold">{meta?.title ?? domain}</p>
            {meta?.description && (
              <p className="text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
            )}
            {!meta?.title && !meta?.description && (
              <p className="text-xs text-muted-foreground">
                This site can&apos;t be embedded — open it to see the full page.
              </p>
            )}
            <a href={normalized} target="_blank" rel="noreferrer">
              <PrimaryBtn icon={ExternalLink}>Open website</PrimaryBtn>
            </a>
          </Body>
        </div>
      )}
    </div>
  );
}
