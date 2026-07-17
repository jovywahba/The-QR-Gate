/**
 * SSRF guard for the server-side URL-metadata fetch. Blocks loopback,
 * private, and link-local hosts so the preview fetcher can only reach
 * public sites.
 */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal") ||
    h.endsWith(".local") ||
    h === "metadata.google.internal"
  ) {
    return true;
  }
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return true;
    }
  }
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  return false;
}

/** Extract an Apple App Store numeric id from a store URL. */
export function appleAppId(url: string): string | null {
  const m = /apps\.apple\.com\/[^?#]*\/id(\d+)/i.exec(url) ?? /\bid(\d{6,})/.exec(url);
  return m ? m[1] : null;
}
