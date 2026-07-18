import { createHash } from "node:crypto";

/**
 * ───────────────────────────────────────────────────────────────
 * Approximate-unique visitor hashing. We NEVER store a raw IP.
 * Instead we keep a one-way, per-day salted hash so the same person
 * scanning twice in a day counts once, but the hash can't be reversed
 * to an IP and rotates daily. The salt (ANALYTICS_HASH_SECRET) is
 * server-only. Pure + deterministic → unit-tested.
 * ───────────────────────────────────────────────────────────────
 */

/** UTC day bucket "YYYY-MM-DD" — the daily rotation key. */
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** sha256(ip | ua | day | secret) → hex. Order + separators are fixed. */
export function visitorHash(args: {
  ip: string;
  ua: string;
  day: string;
  secret: string;
}): string {
  const { ip, ua, day, secret } = args;
  return createHash("sha256").update(`${ip}|${ua}|${day}|${secret}`).digest("hex");
}

/** A minimal read-only header view (works for Headers and Next's ReadonlyHeaders). */
export type HeaderReader = { get(name: string): string | null };

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIpFromHeaders(headers: HeaderReader): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}
