import type { AssetRef, QRContent, SocialItem } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Publishing serialization — pure helpers shared by the publish
 * route (authority) and tests. Extracts asset references and
 * relational items from a content union, and strips transient
 * fields before anything is stored.
 * ───────────────────────────────────────────────────────────────
 */

/** Every uploaded-asset reference inside a content object. */
export function collectAssetRefs(content: QRContent): AssetRef[] {
  const refs: (AssetRef | null)[] = [];
  switch (content.type) {
    case "pdf":
      refs.push(content.data.file);
      break;
    case "links":
      refs.push(content.data.image);
      break;
    case "business":
      refs.push(content.data.logo, content.data.cover);
      break;
    case "video":
      refs.push(content.data.file, content.data.thumbnail);
      break;
    case "images":
      refs.push(...content.data.images.map((i) => i.asset));
      break;
    case "social":
      refs.push(content.data.image);
      break;
    case "mp3":
      refs.push(content.data.file, content.data.cover);
      break;
    case "menu":
      refs.push(content.data.logo, content.data.file);
      break;
    case "apps":
      refs.push(content.data.icon);
      break;
    case "coupon":
      refs.push(content.data.logo);
      break;
    default:
      break;
  }
  return refs.filter((r): r is AssetRef => r !== null);
}

/** Rows for qr_link_items (List of Links). */
export function extractLinkItems(
  content: QRContent,
): Array<{ label: string; url: string; icon: string | null; sort_order: number }> {
  if (content.type !== "links") return [];
  return content.data.links.map((link, i) => ({
    label: link.label.trim(),
    url: link.url.trim(),
    icon: link.icon || null,
    sort_order: i,
  }));
}

/** Rows for qr_social_items (Social Media page + Business socials). */
export function extractSocialItems(
  content: QRContent,
): Array<{ platform: string; label: string | null; url: string; sort_order: number }> {
  const items: SocialItem[] =
    content.type === "social"
      ? content.data.links
      : content.type === "business"
        ? content.data.socials
        : [];
  return items.map((item, i) => ({
    platform: item.platform,
    label: item.label.trim() || null,
    url: item.url.trim(),
    sort_order: i,
  }));
}

/** A human name for the qr_codes row, derived from the content. */
export function displayNameFor(content: QRContent): string {
  switch (content.type) {
    case "website":
      return content.data.title?.trim() || content.data.url.trim();
    case "whatsapp":
      return `WhatsApp ${content.data.phone.trim()}`.trim();
    case "wifi":
      return content.data.ssid.trim();
    case "vcard":
      return [content.data.firstName.trim(), content.data.lastName.trim()].filter(Boolean).join(" ");
    case "pdf":
      return content.data.title.trim();
    case "links":
      return content.data.title.trim();
    case "business":
      return content.data.name.trim();
    case "video":
      return content.data.title.trim();
    case "images":
      return content.data.title.trim() || "Image gallery";
    case "facebook":
      return content.data.pageName.trim() || content.data.url.trim();
    case "instagram":
      return content.data.handle.trim();
    case "social":
      return content.data.title.trim() || "Social links";
    case "mp3":
      return content.data.title.trim();
    case "menu":
      return content.data.businessName.trim() || content.data.menuTitle.trim();
    case "apps":
      return content.data.appName.trim();
    case "coupon":
      return content.data.title.trim();
  }
}

const TRANSIENT_KEYS = new Set(["previewUrl"]);

/** Deep-clone content, dropping transient keys (signed URLs) before storage. */
export function sanitizeContentForStorage<T>(content: T): T {
  return JSON.parse(
    JSON.stringify(content, (key, v) => (TRANSIENT_KEYS.has(key) ? undefined : v)),
  ) as T;
}

/**
 * Storage-safe copy of content: strips transient keys AND redacts
 * secrets we must never persist server-side. Today that's the WiFi
 * password — a native WiFi QR is only ever saved for the dashboard/
 * quota, so the password is blanked (it lived only in the QR image,
 * which the user already downloaded). Never widen what gets stored.
 */
export function redactContentForStorage(content: QRContent): QRContent {
  const clean = sanitizeContentForStorage(content);
  if (clean.type === "wifi") {
    return { type: "wifi", data: { ...clean.data, password: "" } };
  }
  return clean;
}
