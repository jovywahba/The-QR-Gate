import type { QRType } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Homepage demonstration artwork — ONE static image per QR type,
 * shown inside the phone on Step 1 (hover / focus / idle).
 *
 * These are marketing samples only. They are never written to wizard
 * content, never uploaded to Supabase, never published as user data,
 * and never included in a generated QR file. As soon as the user picks
 * a type and starts typing (Step 2+), the panel switches back to the
 * real React destination preview driven by their own content.
 *
 * Keep every path here — components must import this map, never inline
 * an image path.
 * ───────────────────────────────────────────────────────────────
 */

export const qrTypePreviewImages: Record<QRType, string> = {
  website: "/qr-type-previews/Website.png",
  pdf: "/qr-type-previews/PDF.png",
  links: "/qr-type-previews/List_of_Links.png",
  vcard: "/qr-type-previews/vCard.png",
  business: "/qr-type-previews/Business.png",
  video: "/qr-type-previews/Video.png",
  images: "/qr-type-previews/Images.png",
  facebook: "/qr-type-previews/Facebook.png",
  instagram: "/qr-type-previews/Instagram.png",
  social: "/qr-type-previews/Social_Media.png",
  whatsapp: "/qr-type-previews/WhatsApp.png",
  mp3: "/qr-type-previews/MP3.png",
  menu: "/qr-type-previews/Menu.png",
  apps: "/qr-type-previews/Apps.png",
  coupon: "/qr-type-previews/Coupon.png",
  wifi: "/qr-type-previews/WiFi.png",
};

/** Intrinsic size of every supplied preview (they share one canvas). */
export const QR_TYPE_PREVIEW_WIDTH = 941;
export const QR_TYPE_PREVIEW_HEIGHT = 1672;

/** The type shown before anything is hovered or selected. */
export const DEFAULT_PREVIEW_TYPE: QRType = "website";

/** Accessible label, e.g. "Website mobile destination preview". */
export function qrTypePreviewAlt(typeName: string): string {
  return `${typeName} mobile destination preview`;
}
