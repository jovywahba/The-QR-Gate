import { parseAudioUrl, parseVideoUrl } from "./embeds";
import { normalizeUrl } from "./payloads";
import type { QRContent } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Preview capability model — how the mobile preview should render a
 * given QR type's CURRENT content. The screen picks the best real
 * option and never fabricates content.
 * ───────────────────────────────────────────────────────────────
 */
export type PreviewCapability =
  | "local-file" //        a real File → object URL (native player)
  | "native-player" //     a real hosted media URL (<audio>/<video>/<object>)
  | "official-embed" //    an official third-party iframe (YouTube/Vimeo/FB)
  | "sandboxed-iframe" //  the site itself in a sandboxed iframe (if embeddable)
  | "metadata-card" //     real fetched page metadata (title/desc/OG image)
  | "structured-content" // the user's own structured fields (links, contact…)
  | "external-open" //     honest fallback: real normalized URL + Open button
  | "empty"; //            nothing entered yet → honest empty state

export type YouTubeOrVimeo = { provider: "youtube" | "vimeo"; embedUrl: string; watchUrl: string };

/** Resolve an official video embed for the current video content, if any. */
export function videoEmbed(content: Extract<QRContent, { type: "video" }>): YouTubeOrVimeo | null {
  if (content.data.mode !== "url") return null;
  const parsed = parseVideoUrl(content.data.videoUrl);
  if (parsed && parsed.embedUrl && (parsed.provider === "youtube" || parsed.provider === "vimeo")) {
    return { provider: parsed.provider, embedUrl: parsed.embedUrl, watchUrl: parsed.watchUrl };
  }
  return null;
}

/** The best capability for the current content of a type. */
export function previewCapability(content: QRContent): PreviewCapability {
  switch (content.type) {
    case "website": {
      // The website screen fetches metadata + embeddability; either way
      // it renders real data (iframe when embeddable, else metadata card).
      return normalizeUrl(content.data.url) ? "sandboxed-iframe" : "empty";
    }
    case "pdf":
      return content.data.file ? "native-player" : "empty";
    case "video": {
      if (content.data.mode === "upload") return content.data.file ? "native-player" : "empty";
      const parsed = parseVideoUrl(content.data.videoUrl);
      if (!parsed) return "empty";
      if (parsed.embedUrl) return "official-embed";
      return parsed.provider === "file" ? "native-player" : "external-open";
    }
    case "mp3": {
      if (content.data.mode === "upload") return content.data.file ? "native-player" : "empty";
      return parseAudioUrl(content.data.audioUrl) ? "native-player" : "empty";
    }
    case "images":
      return content.data.images.length ? "structured-content" : "empty";
    case "menu": {
      if (content.data.mode === "pdf") return content.data.file ? "native-player" : "empty";
      return normalizeUrl(content.data.menuUrl) ? "external-open" : "empty";
    }
    case "instagram":
    case "facebook":
      return "official-embed"; // with an honest open/metadata fallback
    case "apps":
      return "metadata-card"; // real store metadata when available, else entered
    case "links":
    case "vcard":
    case "business":
    case "social":
    case "whatsapp":
    case "coupon":
    case "wifi":
      return "structured-content";
  }
}
