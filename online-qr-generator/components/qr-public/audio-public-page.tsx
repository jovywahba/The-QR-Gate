import { Download, Music } from "lucide-react";
import { parseAudioUrl } from "@/lib/qr/embeds";
import type { MP3Content } from "@/lib/qr/types";
import type { AssetResolver } from "./resolver";
import { ActionLink, EmptyHint } from "./shared";

/** Real HTML audio player. Never autoplays; no fake waveforms. */
export function AudioPublicPage({ data, resolveAsset }: { data: MP3Content; resolveAsset: AssetResolver }) {
  const uploadedUrl = data.mode === "upload" ? resolveAsset(data.file) : null;
  const external = data.mode === "url" ? parseAudioUrl(data.audioUrl) : null;
  const audioSrc = uploadedUrl ?? (external?.provider === "file" ? external.url : null);
  const coverUrl = resolveAsset(data.cover);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 text-center">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="size-32 rounded-lg border object-cover" />
        ) : (
          <span className="flex size-32 items-center justify-center rounded-lg border bg-muted/40">
            <Music className="size-8 text-muted-foreground" aria-hidden />
          </span>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{data.title.trim() || "Audio"}</h1>
          {data.artist.trim() && <p className="text-sm text-muted-foreground">{data.artist}</p>}
        </div>
      </div>

      {data.description.trim() && (
        <p className="text-center text-sm leading-relaxed text-muted-foreground">{data.description}</p>
      )}

      {audioSrc ? (
        <audio controls preload="metadata" src={audioSrc} className="w-full">
          Your browser can&apos;t play this audio. <a href={audioSrc}>Open the file instead.</a>
        </audio>
      ) : external ? (
        <ActionLink href={external.url}>Listen</ActionLink>
      ) : (
        <EmptyHint>Add an audio URL or upload an MP3 and the player appears here.</EmptyHint>
      )}

      {data.allowDownload && uploadedUrl && (
        <ActionLink href={uploadedUrl} variant="outline" download>
          <Download className="size-4" aria-hidden />
          Download
        </ActionLink>
      )}
    </div>
  );
}
