import { normalizeUrl } from "@/lib/qr/payloads";
import type { ImagesContent } from "@/lib/qr/types";
import type { AssetResolver } from "./resolver";
import { ActionLink, EmptyHint } from "./shared";

/**
 * Responsive gallery. Plain <img loading="lazy"> by design: the same
 * component renders owner previews (short-lived signed URLs) and
 * public pages (dynamic per-project Supabase hosts), which next/image
 * can't cover without per-deploy remotePatterns — correctness over
 * the optimizer here.
 */
export function ImagesPublicPage({ data, resolveAsset }: { data: ImagesContent; resolveAsset: AssetResolver }) {
  const images = data.images
    .map((image) => ({ ...image, url: resolveAsset(image.asset) }))
    .filter((image) => image.url);
  const ctaUrl = data.ctaLabel.trim() && data.ctaUrl?.trim() ? normalizeUrl(data.ctaUrl) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{data.title.trim() || "Gallery"}</h1>
        {data.description.trim() && (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        )}
      </div>

      {images.length === 0 ? (
        <EmptyHint>Upload images and the gallery appears here.</EmptyHint>
      ) : (
        <ul className={images.length > 1 ? "grid grid-cols-2 gap-2" : "space-y-2"}>
          {images.map((image, i) => (
            <li key={image.id} className={images.length > 1 && i === 0 ? "col-span-2" : undefined}>
              <figure className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url!}
                  alt={image.caption.trim() || `Image ${i + 1} of ${images.length}`}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="w-full rounded-lg border object-cover"
                />
                {image.caption.trim() && (
                  <figcaption className="text-xs text-muted-foreground">{image.caption}</figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      )}

      {ctaUrl && <ActionLink href={ctaUrl}>{data.ctaLabel}</ActionLink>}
    </div>
  );
}
