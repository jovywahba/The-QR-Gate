import type { AssetRef } from "@/lib/qr/types";

/**
 * The same destination components render in two worlds:
 *  - the wizard's live "Mobile Page" preview (owner's signed URLs),
 *  - the published /q/[slug] page (public bucket URLs from the RPC).
 * An AssetResolver abstracts where the image/file URL comes from.
 */
export type AssetResolver = (ref: AssetRef | null | undefined) => string | null;

/** Wizard preview: transient signed URLs carried on the ref itself. */
export const previewResolver: AssetResolver = (ref) => ref?.previewUrl ?? null;

export type PublicAssetRow = {
  id: string;
  asset_type: string;
  public_url: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  sort_order: number;
};

/** Published page: public bucket URLs keyed by asset id. */
export function publicResolver(assets: PublicAssetRow[]): AssetResolver {
  const byId = new Map(assets.map((a) => [a.id, a.public_url]));
  return (ref) => (ref ? (byId.get(ref.assetId) ?? null) : null);
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
