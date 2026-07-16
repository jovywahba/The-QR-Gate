import { normalizeUrl } from "./payloads";

/**
 * ───────────────────────────────────────────────────────────────
 * Safe video/audio URL parsing. Embeds are ONLY ever generated for
 * approved origins (YouTube via youtube-nocookie, Vimeo player) —
 * anything else gets a plain link or native <video>/<audio> for
 * direct file URLs. No arbitrary iframes, ever.
 * ───────────────────────────────────────────────────────────────
 */

export type ParsedVideo = {
  provider: "youtube" | "vimeo" | "file" | "link";
  /** Set only for approved embed origins. */
  embedUrl?: string;
  /** The normalized URL a scanner/viewer opens. */
  watchUrl: string;
};

const YT_ID = /^[a-zA-Z0-9_-]{6,20}$/;
const VIMEO_ID = /^\d{6,12}$/;
const VIDEO_FILE = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i;
const AUDIO_FILE = /\.(mp3|m4a|aac|ogg|oga|wav|flac)(\?.*)?$/i;

export function parseVideoUrl(input: string): ParsedVideo | null {
  const normalized = normalizeUrl(input);
  if (!normalized || !normalized.startsWith("https://")) return null;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    let id: string | null = null;
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] ?? null;
    else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] ?? null;
    else if (url.pathname.startsWith("/live/")) id = url.pathname.split("/")[2] ?? null;
    if (!id || !YT_ID.test(id)) return null;
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (!id || !YT_ID.test(id)) return null;
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  if (host === "vimeo.com") {
    const id = url.pathname.slice(1).split("/")[0];
    if (!id || !VIMEO_ID.test(id)) return null;
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}`,
      watchUrl: `https://vimeo.com/${id}`,
    };
  }

  if (host === "player.vimeo.com") {
    const id = url.pathname.split("/")[2];
    if (!id || !VIMEO_ID.test(id)) return null;
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}`,
      watchUrl: `https://vimeo.com/${id}`,
    };
  }

  // Direct HTTPS video file → native <video>; other https URLs → plain link.
  return { provider: VIDEO_FILE.test(url.pathname) ? "file" : "link", watchUrl: normalized };
}

/** Public audio URL: https only; "file" means the native player can take it. */
export function parseAudioUrl(input: string): { provider: "file" | "link"; url: string } | null {
  const normalized = normalizeUrl(input);
  if (!normalized || !normalized.startsWith("https://")) return null;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }
  return { provider: AUDIO_FILE.test(url.pathname) ? "file" : "link", url: normalized };
}
