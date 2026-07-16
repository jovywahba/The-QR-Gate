import { ExternalLink, Play } from "lucide-react";
import { parseVideoUrl } from "@/lib/qr/embeds";
import { normalizeUrl } from "@/lib/qr/payloads";
import type { VideoContent } from "@/lib/qr/types";
import type { AssetResolver } from "./resolver";
import { ActionLink, EmptyHint } from "./shared";

/**
 * Safe playback only: iframes are limited to the approved
 * youtube-nocookie / player.vimeo embed origins produced by
 * parseVideoUrl; anything else is a native <video> (direct files) or
 * a plain outbound link. No arbitrary embed URLs, no untrusted HTML.
 */
export function VideoPublicPage({ data, resolveAsset }: { data: VideoContent; resolveAsset: AssetResolver }) {
  const uploadedUrl = data.mode === "upload" ? resolveAsset(data.file) : null;
  const parsed = data.mode === "url" ? parseVideoUrl(data.videoUrl) : null;
  const thumbnailUrl = resolveAsset(data.thumbnail);
  const ctaUrl = data.ctaLabel.trim() && data.ctaUrl.trim() ? normalizeUrl(data.ctaUrl) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{data.title.trim() || "Video"}</h1>
        {data.description.trim() && (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        )}
      </div>

      {uploadedUrl ? (
        <video
          controls
          preload="metadata"
          poster={thumbnailUrl ?? undefined}
          src={uploadedUrl}
          className="aspect-video w-full rounded-lg border bg-black"
        >
          Your browser can&apos;t play this video.{" "}
          <a href={uploadedUrl}>Open the video file instead.</a>
        </video>
      ) : parsed?.embedUrl ? (
        <iframe
          src={parsed.embedUrl}
          title={data.title.trim() || "Video"}
          className="aspect-video w-full rounded-lg border"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      ) : parsed?.provider === "file" ? (
        <video controls preload="metadata" src={parsed.watchUrl} className="aspect-video w-full rounded-lg border bg-black" />
      ) : parsed ? (
        <ActionLink href={parsed.watchUrl}>
          <Play className="size-4" aria-hidden />
          Watch video
        </ActionLink>
      ) : (
        <EmptyHint>Add a video URL or upload a file and the player appears here.</EmptyHint>
      )}

      {parsed?.embedUrl && (
        <p className="text-center">
          <a
            href={parsed.watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink className="size-3" aria-hidden />
            Open on {parsed.provider === "youtube" ? "YouTube" : "Vimeo"}
          </a>
        </p>
      )}

      {ctaUrl && <ActionLink href={ctaUrl}>{data.ctaLabel}</ActionLink>}
    </div>
  );
}
