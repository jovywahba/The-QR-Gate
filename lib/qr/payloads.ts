import type {
  FacebookContent,
  InstagramContent,
  MenuContent,
  MP3Content,
  QRContent,
  VCardContent,
  VideoContent,
  WebsiteContent,
  WhatsAppContent,
  WiFiContent,
} from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Payload builders — pure functions from validated content to the
 * exact string a scanner reads. Every builder returns "" when the
 * content can't produce a scannable payload (the renderer shows an
 * empty state and download stays disabled).
 * ───────────────────────────────────────────────────────────────
 */

/* ── Website ── */

/**
 * Normalize user input ("example.com") to a full URL ("https://example.com").
 * Returns null when the input can't be a valid http(s) URL.
 */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  // No spaces inside a URL, and require at least one dot or localhost.
  if (/\s/.test(raw)) return null;

  // A leading "scheme:" counts only when it isn't a host:port ("localhost:3000").
  const hasScheme =
    /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw) ||
    (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) && !/^[^:/]+:\d/.test(raw));
  const withScheme = hasScheme ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // Reject hostnames with no TLD-ish shape (but allow localhost + IPs).
  const host = url.hostname;
  const isLocalhost = host === "localhost";
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  if (!isLocalhost && !isIp && !host.includes(".")) return null;
  if (host.endsWith(".") || host.startsWith(".")) return null;

  return url.toString();
}

export function buildWebsitePayload(data: WebsiteContent): string {
  return normalizeUrl(data.url) ?? "";
}

/* ── WhatsApp ── */

/** Strip spaces, plus signs, brackets, and hyphens; keep digits only. */
export function cleanWhatsAppPhone(countryCode: string, phone: string): string {
  const digits = `${countryCode}${phone}`.replace(/[\s+()\-]/g, "");
  return /^\d+$/.test(digits) ? digits : "";
}

export function buildWhatsAppPayload(data: WhatsAppContent): string {
  const phone = cleanWhatsAppPhone(data.countryCode, data.phone);
  if (phone.length < 6 || phone.length > 15) return "";
  const message = data.message?.trim();
  return message
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${phone}`;
}

/* ── WiFi ── */

/** Escape \ ; , : " for the WIFI: payload (backslash first). */
export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiPayload(data: WiFiContent): string {
  const ssid = data.ssid.trim();
  if (!ssid) return "";
  const needsPassword = data.encryption !== "nopass";
  if (needsPassword && !data.password) return "";

  const parts = [
    `T:${data.encryption === "nopass" ? "nopass" : data.encryption}`,
    `S:${escapeWifiValue(ssid)}`,
  ];
  if (needsPassword) parts.push(`P:${escapeWifiValue(data.password)}`);
  parts.push(`H:${data.hidden ? "true" : "false"}`);

  return `WIFI:${parts.join(";")};;`;
}

/* ── vCard ── */

/** Escape backslash, comma, semicolon; fold line breaks to \n (vCard 3.0). */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildVCardPayload(data: VCardContent): string {
  const first = data.firstName.trim();
  const last = data.lastName.trim();
  if (!first && !last) return "";

  const e = escapeVCardValue;
  const fullName = [first, last].filter(Boolean).join(" ");

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${e(last)};${e(first)};;;`,
    `FN:${e(fullName)}`,
  ];

  if (data.company?.trim()) lines.push(`ORG:${e(data.company.trim())}`);
  if (data.jobTitle?.trim()) lines.push(`TITLE:${e(data.jobTitle.trim())}`);
  if (data.mobile?.trim()) lines.push(`TEL;TYPE=CELL:${e(data.mobile.trim())}`);
  if (data.phone?.trim()) lines.push(`TEL;TYPE=WORK,VOICE:${e(data.phone.trim())}`);
  if (data.email?.trim()) lines.push(`EMAIL:${e(data.email.trim())}`);
  if (data.website?.trim()) {
    const url = normalizeUrl(data.website);
    if (url) lines.push(`URL:${e(url)}`);
  }
  const street = data.street?.trim() ?? "";
  const city = data.city?.trim() ?? "";
  const country = data.country?.trim() ?? "";
  if (street || city || country) {
    lines.push(`ADR;TYPE=WORK:;;${e(street)};${e(city)};;;${e(country)}`);
  }
  if (data.note?.trim()) lines.push(`NOTE:${e(data.note.trim())}`);

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

/* ── Facebook ── */

const FB_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.com", "www.fb.com"]);
const FB_HANDLE = /^[a-zA-Z0-9.\-]{1,80}$/;

/** Page URL or bare page name → https://www.facebook.com/{path}. Null when invalid. */
export function normalizeFacebookUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (FB_HANDLE.test(raw) && !raw.includes("..")) {
    return `https://www.facebook.com/${raw}`;
  }

  const normalized = normalizeUrl(raw);
  if (!normalized) return null;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }
  if (!FB_HOSTS.has(url.hostname.toLowerCase())) return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (!path || path === "/") return null;
  return `https://www.facebook.com${path}${url.search}`;
}

export function buildFacebookPayload(data: FacebookContent): string {
  return normalizeFacebookUrl(data.url) ?? "";
}

/* ── Instagram ── */

const IG_USERNAME = /^[a-zA-Z0-9._]{1,30}$/;
const IG_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);

/** "@example", "example", or a profile URL → https://www.instagram.com/example/. */
export function normalizeInstagramInput(input: string): string | null {
  let raw = input.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw) || /^(www\.|m\.)?instagram\.com\//i.test(raw)) {
    const normalized = normalizeUrl(raw);
    if (!normalized) return null;
    let url: URL;
    try {
      url = new URL(normalized);
    } catch {
      return null;
    }
    if (!IG_HOSTS.has(url.hostname.toLowerCase())) return null;
    raw = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (raw.startsWith("@")) {
    raw = raw.slice(1);
  }

  if (!IG_USERNAME.test(raw)) return null;
  if (raw.startsWith(".") || raw.endsWith(".") || raw.includes("..")) return null;
  return `https://www.instagram.com/${raw}/`;
}

export function buildInstagramPayload(data: InstagramContent): string {
  return normalizeInstagramInput(data.handle) ?? "";
}

/* ── URL-mode direct payloads (Video / MP3 / Menu) ── */

function httpsUrlOrEmpty(input: string): string {
  const normalized = normalizeUrl(input);
  return normalized && normalized.startsWith("https://") ? normalized : "";
}

export function buildVideoUrlPayload(data: VideoContent): string {
  return data.mode === "url" ? httpsUrlOrEmpty(data.videoUrl) : "";
}

export function buildMp3UrlPayload(data: MP3Content): string {
  return data.mode === "url" ? httpsUrlOrEmpty(data.audioUrl) : "";
}

/** Menu URL mode is direct only when no extra business info is supplied. */
export function menuHasBusinessExtras(data: MenuContent): boolean {
  return Boolean(
    data.businessName.trim() ||
      data.phone.trim() ||
      data.email.trim() ||
      data.address.trim() ||
      data.logo ||
      (data.ctaLabel.trim() && data.ctaUrl.trim()),
  );
}

export function buildMenuUrlPayload(data: MenuContent): string {
  if (data.mode !== "url" || menuHasBusinessExtras(data)) return "";
  return httpsUrlOrEmpty(data.menuUrl);
}

/* ── Hosted-vs-direct decision ── */

/**
 * Does this content need a published /q/[slug] page before a QR can
 * exist? Hosted payloads are NEVER generated locally — the publish
 * flow supplies the public URL.
 */
export function requiresPublishing(content: QRContent): boolean {
  switch (content.type) {
    case "website":
    case "whatsapp":
    case "wifi":
    case "vcard":
    case "facebook":
    case "instagram":
      return false;
    case "video":
      return content.data.mode === "upload";
    case "mp3":
      return content.data.mode === "upload";
    case "menu":
      return content.data.mode === "pdf" || menuHasBusinessExtras(content.data);
    case "pdf":
    case "links":
    case "business":
    case "images":
    case "social":
    case "apps":
    case "coupon":
      return true;
  }
}

/* ── Dispatcher ── */

/**
 * Content → the exact scannable string for DIRECT payloads; "" when
 * nothing valid to encode or when the type requires publishing (the
 * wizard swaps in the published /q/[slug] URL after publish succeeds).
 */
export function buildPayload(content: QRContent): string {
  switch (content.type) {
    case "website":
      return buildWebsitePayload(content.data);
    case "whatsapp":
      return buildWhatsAppPayload(content.data);
    case "wifi":
      return buildWifiPayload(content.data);
    case "vcard":
      return buildVCardPayload(content.data);
    case "facebook":
      return buildFacebookPayload(content.data);
    case "instagram":
      return buildInstagramPayload(content.data);
    case "video":
      return buildVideoUrlPayload(content.data);
    case "mp3":
      return buildMp3UrlPayload(content.data);
    case "menu":
      return buildMenuUrlPayload(content.data);
    case "pdf":
    case "links":
    case "business":
    case "images":
    case "social":
    case "apps":
    case "coupon":
      return "";
  }
}
