"use client";

/**
 * Official third-party iframe embeds only — YouTube (privacy-enhanced
 * nocookie), Vimeo player, and the Facebook Page Plugin. We only ever
 * frame an official embed endpoint (never scrape or proxy the site),
 * and everything is sandboxed. Anything unsupported returns null so
 * the caller can show an honest open/metadata fallback.
 */

export function YouTubeEmbed({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <iframe
      src={embedUrl}
      title={title}
      className="aspect-video w-full border-0"
      loading="lazy"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
    />
  );
}

export function VimeoEmbed({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <iframe
      src={embedUrl}
      title={title}
      className="aspect-video w-full border-0"
      loading="lazy"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
    />
  );
}

const FB_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.com"]);

/** The Facebook Page Plugin — an official iframe endpoint for PUBLIC
 *  pages (no SDK, no app id). Returns null for non-page URLs. */
export function facebookPluginUrl(pageUrl: string): string | null {
  try {
    const u = new URL(pageUrl);
    if (!FB_HOSTS.has(u.hostname.toLowerCase())) return null;
    const href = encodeURIComponent(pageUrl);
    return `https://www.facebook.com/plugins/page.php?href=${href}&tabs=timeline&width=280&height=360&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false`;
  } catch {
    return null;
  }
}

export function FacebookEmbed({ pageUrl }: { pageUrl: string }) {
  const src = facebookPluginUrl(pageUrl);
  if (!src) return null;
  return (
    <iframe
      src={src}
      title="Facebook page"
      className="h-[340px] w-full border-0"
      loading="lazy"
      scrolling="no"
      allow="encrypted-media"
      sandbox="allow-scripts allow-same-origin allow-popups"
    />
  );
}
