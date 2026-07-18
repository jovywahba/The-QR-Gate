/**
 * The public origin encoded into hosted QR codes. Never hardcode the
 * domain: production sets NEXT_PUBLIC_APP_URL (falling back to the
 * template's NEXT_PUBLIC_SITE_URL); local dev falls back to localhost
 * for browser testing only.
 */
export function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** The real destination a published QR encodes: {appUrl}/q/{slug}. */
export function publicQrUrl(slug: string): string {
  return `${getAppUrl()}/q/${slug}`;
}

/** The tracked short link a direct-URL QR can encode: {appUrl}/r/{slug}. */
export function trackedRedirectUrl(slug: string): string {
  return `${getAppUrl()}/r/${slug}`;
}
