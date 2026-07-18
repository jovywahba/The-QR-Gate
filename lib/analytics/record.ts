import "server-only";
import { randomBytes } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { clientIpFromHeaders, dayKey, visitorHash, type HeaderReader } from "./hash";
import { isBot, parseUserAgent, referrerHost } from "./ua";

/**
 * The salt for the one-way visitor hash. Prefer the configured secret;
 * if it's missing we generate a random per-process secret rather than
 * fall back to a committed constant — a publicly-known salt would make
 * the hash reversible to a raw IP. (Set ANALYTICS_HASH_SECRET in prod
 * for stable cross-instance unique counts.)
 */
const HASH_SECRET = process.env.ANALYTICS_HASH_SECRET || randomBytes(32).toString("hex");

/**
 * ───────────────────────────────────────────────────────────────
 * Server-side scan recorder — the ONE place a qr_scan_events row is
 * written, always via the service role (end users can't insert). It
 * refuses to count:
 *   • bots / link-preview fetchers (UA)
 *   • prefetches (Sec-Purpose / Next router prefetch)
 *   • the QR owner previewing their own code
 * so one real page open ⇒ at most one real scan.
 * ───────────────────────────────────────────────────────────────
 */

type Admin = ReturnType<typeof createAdminClient>;

/** A same-page prefetch, not a real visit. */
export function isPrefetch(headers: HeaderReader): boolean {
  const sec = headers.get("sec-purpose") ?? "";
  if (sec.includes("prefetch")) return true;
  if ((headers.get("purpose") ?? "").toLowerCase() === "prefetch") return true;
  if (headers.get("next-router-prefetch") === "1") return true;
  if (headers.get("x-middleware-prefetch") === "1") return true;
  return false;
}

function decodeHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value) || null;
  } catch {
    return value || null;
  }
}

export type RecordScanResult = { recorded: boolean; reason?: string; isBot?: boolean };

export async function recordScan(
  admin: Admin,
  args: {
    qrCodeId: string;
    ownerId: string | null;
    viewerId: string | null;
    headers: HeaderReader;
  },
): Promise<RecordScanResult> {
  const { qrCodeId, ownerId, viewerId, headers } = args;

  if (isPrefetch(headers)) return { recorded: false, reason: "prefetch" };
  if (viewerId && ownerId && viewerId === ownerId) return { recorded: false, reason: "owner" };

  const ua = headers.get("user-agent") ?? "";
  const info = parseUserAgent(ua);
  const bot = info.isBot || isBot(ua);

  const ip = clientIpFromHeaders(headers);
  const hash = visitorHash({ ip, ua, day: dayKey(), secret: HASH_SECRET });

  const { error } = await admin.from("qr_scan_events").insert({
    qr_code_id: qrCodeId,
    country: headers.get("x-vercel-ip-country"),
    region: decodeHeader(headers.get("x-vercel-ip-country-region")),
    city: decodeHeader(headers.get("x-vercel-ip-city")),
    device_type: info.deviceType,
    browser: info.browser,
    operating_system: info.os,
    referrer: referrerHost(headers.get("referer")),
    visitor_hash: hash,
    is_bot: bot,
  });

  if (error) {
    console.error("scan record failed:", error.code);
    return { recorded: false, reason: "error" };
  }
  return { recorded: !bot, isBot: bot };
}

/** Resolve a public slug to the minimal routing/ownership fields (service role). */
export async function resolveSlug(
  admin: Admin,
  slug: string,
): Promise<{
  id: string;
  user_id: string;
  status: string;
  destination_url: string | null;
  tracking_mode: string;
} | null> {
  const { data } = await admin
    .from("qr_codes")
    .select("id, user_id, status, destination_url, tracking_mode")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}
