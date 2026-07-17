import type { AssetRef, QRContent, QRType } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Hover-preview sample data.
 *
 * Each QR type has one realistic `QRContent` used ONLY to populate
 * the right-side mobile preview when a Step-1 card is hovered/focused.
 * These are rendered through the SAME destination-preview components
 * as real form data, so the hover preview looks exactly like the
 * live one — just with illustrative content.
 *
 * This is preview-only sample data. It is never persisted, never
 * encoded into a QR, and never mixed with the user's saved form data.
 * Sample images are self-contained inline SVG data URIs (no network,
 * no assets to upload).
 * ───────────────────────────────────────────────────────────────
 */

/** A tiny gradient image (optionally with a label) as a data URI. */
function img(w: number, h: number, from: string, to: string, label = ""): string {
  const fontSize = Math.round(Math.min(w, h) * 0.4);
  const text = label
    ? `<text x='50%' y='54%' font-family='sans-serif' font-weight='600' font-size='${fontSize}' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'>${label}</text>`
    : "";
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
    `</linearGradient></defs>` +
    `<rect width='${w}' height='${h}' fill='url(%23g)'/>${text}</svg>`;
  // Colors already use %23 for '#'; spaces are the only other char to encode.
  return `data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/ /g, "%20")}`;
}

/** Build a preview-only AssetRef whose previewUrl the resolver reads directly. */
function asset(
  fileName: string,
  previewUrl: string,
  mimeType = "image/svg+xml",
  fileSize = 48_000,
): AssetRef {
  return { assetId: `sample-${fileName}`, fileName, fileSize, mimeType, previewUrl };
}

const AVATAR = img(120, 120, "#3B5BFF", "#1B1B2F", "SH");
const COVER = img(320, 140, "#1B1B2F", "#3B5BFF");
const VIDEO_THUMB = img(320, 180, "#3B5BFF", "#1B1B2F");
const APP_ICON = img(120, 120, "#3B5BFF", "#6E86FF", "Q");
const ALBUM = img(160, 160, "#1B8A5B", "#1B1B2F");
const BIZ_LOGO = img(120, 120, "#1B1B2F", "#6B675C", "NB");
const COUPON_LOGO = img(120, 120, "#C2392F", "#1B1B2F", "%");
const GALLERY = [
  img(200, 200, "#3B5BFF", "#6E86FF"),
  img(200, 200, "#1B8A5B", "#9AD6B4"),
  img(200, 200, "#D9A21B", "#F0D89B"),
  img(200, 200, "#1B1B2F", "#6B675C"),
];

/** One realistic sample per QR type. Built once at module load. */
const SAMPLES: Record<QRType, QRContent> = {
  website: {
    type: "website",
    data: {
      url: "https://theqrgate.com",
      title: "The QR Gate",
      description: "Create, customize, and share QR codes",
    },
  },
  pdf: {
    type: "pdf",
    data: {
      title: "2026 Product Catalog",
      description: "Everything we make, in one place.",
      buttonLabel: "Open PDF",
      file: asset("product-catalog.pdf", COVER, "application/pdf", 2_400_000),
    },
  },
  links: {
    type: "links",
    data: {
      title: "Sara Hassan",
      description: "Product designer · Cairo",
      image: asset("avatar.svg", AVATAR),
      links: [
        { id: "l1", label: "My website", url: "https://theqrgate.com", icon: "globe" },
        { id: "l2", label: "Instagram", url: "https://instagram.com/theqrgate", icon: "instagram" },
        { id: "l3", label: "Portfolio", url: "https://theqrgate.com/work", icon: "link" },
      ],
    },
  },
  vcard: {
    type: "vcard",
    data: {
      firstName: "Sara",
      lastName: "Hassan",
      company: "The QR Gate",
      jobTitle: "Product Designer",
      mobile: "+20 100 123 4567",
      phone: "",
      email: "sara@theqrgate.com",
      website: "theqrgate.com",
      street: "12 Nile St.",
      city: "Cairo",
      country: "Egypt",
      note: "",
    },
  },
  business: {
    type: "business",
    data: {
      name: "Nile Bistro",
      category: "Restaurant",
      headline: "Fresh, seasonal, riverside.",
      description: "Modern Egyptian plates and specialty coffee by the water.",
      logo: asset("biz-logo.svg", BIZ_LOGO),
      cover: asset("biz-cover.svg", COVER),
      phone: "+20 2 1234 5678",
      email: "hello@nilebistro.com",
      website: "nilebistro.com",
      street: "12 Nile St.",
      city: "Cairo",
      country: "Egypt",
      hours: [
        { day: "mon", closed: false, opens: "09:00", closes: "18:00" },
        { day: "tue", closed: false, opens: "09:00", closes: "18:00" },
        { day: "wed", closed: false, opens: "09:00", closes: "18:00" },
        { day: "thu", closed: false, opens: "09:00", closes: "18:00" },
        { day: "fri", closed: false, opens: "09:00", closes: "22:00" },
        { day: "sat", closed: false, opens: "10:00", closes: "16:00" },
        { day: "sun", closed: true, opens: "09:00", closes: "18:00" },
      ],
      socials: [
        { id: "b1", platform: "instagram", label: "", url: "https://instagram.com/nilebistro" },
        { id: "b2", platform: "facebook", label: "", url: "https://facebook.com/nilebistro" },
      ],
      ctaLabel: "Book a table",
      ctaUrl: "https://nilebistro.com/book",
    },
  },
  video: {
    type: "video",
    data: {
      title: "Product walkthrough",
      mode: "url",
      videoUrl: "https://theqrgate.com/watch/demo",
      file: null,
      thumbnail: asset("thumbnail.svg", VIDEO_THUMB),
      description: "A 90-second tour of everything The QR Gate can do.",
      ctaLabel: "Visit our site",
      ctaUrl: "https://theqrgate.com",
    },
  },
  images: {
    type: "images",
    data: {
      title: "Summer collection",
      description: "A few favorites from this season.",
      images: [
        { id: "g1", asset: asset("photo-1.svg", GALLERY[0]), caption: "The riverside terrace" },
        { id: "g2", asset: asset("photo-2.svg", GALLERY[1]), caption: "Morning pour-over" },
        { id: "g3", asset: asset("photo-3.svg", GALLERY[2]), caption: "Seasonal plates" },
        { id: "g4", asset: asset("photo-4.svg", GALLERY[3]), caption: "Evening lights" },
      ],
      ctaLabel: "Visit our shop",
      ctaUrl: "https://theqrgate.com/shop",
    },
  },
  facebook: {
    type: "facebook",
    data: {
      url: "https://facebook.com/theqrgate",
      pageName: "The QR Gate",
      description: "Follow us for QR tips, templates, and product updates.",
    },
  },
  instagram: {
    type: "instagram",
    data: {
      handle: "@theqrgate",
      title: "The QR Gate",
      description: "QR codes that actually look good. New templates weekly.",
    },
  },
  social: {
    type: "social",
    data: {
      title: "Follow The QR Gate",
      description: "All our channels in one place.",
      image: asset("social-avatar.svg", APP_ICON),
      links: [
        { id: "s1", platform: "instagram", label: "Instagram", url: "https://instagram.com/theqrgate" },
        { id: "s2", platform: "youtube", label: "YouTube", url: "https://youtube.com/@theqrgate" },
        { id: "s3", platform: "tiktok", label: "TikTok", url: "https://tiktok.com/@theqrgate" },
        { id: "s4", platform: "x", label: "X", url: "https://x.com/theqrgate" },
      ],
    },
  },
  whatsapp: {
    type: "whatsapp",
    data: {
      countryCode: "+20",
      phone: "100 123 4567",
      message: "Hi! I'd like to know more about your menu.",
    },
  },
  mp3: {
    type: "mp3",
    data: {
      title: "Episode 12 — Designing for scans",
      artist: "The QR Gate Podcast",
      mode: "url",
      audioUrl: "https://theqrgate.com/audio/episode-12.mp3",
      file: null,
      cover: asset("album.svg", ALBUM),
      description: "How great QR design boosts real-world scan rates.",
      allowDownload: false,
    },
  },
  menu: {
    type: "menu",
    data: {
      businessName: "Nile Bistro",
      menuTitle: "Dinner menu",
      description: "Seasonal plates, updated weekly.",
      logo: asset("menu-logo.svg", BIZ_LOGO),
      mode: "pdf",
      menuUrl: "",
      file: asset("dinner-menu.pdf", COVER, "application/pdf", 1_200_000),
      phone: "+20 2 1234 5678",
      email: "hello@nilebistro.com",
      address: "12 Nile St., Cairo",
      ctaLabel: "Book a table",
      ctaUrl: "https://nilebistro.com/book",
    },
  },
  apps: {
    type: "apps",
    data: {
      appName: "The QR Gate",
      description: "Create and manage QR codes from your phone.",
      icon: asset("app-icon.svg", APP_ICON),
      appStoreUrl: "https://apps.apple.com/app/id123456789",
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.theqrgate.app",
      appGalleryUrl: "",
      websiteUrl: "https://theqrgate.com",
    },
  },
  coupon: {
    type: "coupon",
    data: {
      title: "Summer sale",
      code: "SUMMER20",
      description: "20% off your next order, this month only.",
      discountType: "percent",
      discountValue: "20",
      businessName: "Nile Bistro",
      logo: asset("coupon-logo.svg", COUPON_LOGO),
      terms: "One per customer. Not valid with other offers.",
      expiresAt: "2027-12-31",
      redemptionUrl: "https://nilebistro.com/redeem",
      instructions: "Show this code at the counter.",
      ctaLabel: "Redeem offer",
    },
  },
  wifi: {
    type: "wifi",
    data: {
      ssid: "Nile Bistro Guest",
      password: "riverside2026",
      encryption: "WPA",
      hidden: false,
    },
  },
};

/** The illustrative sample content for a QR type's hover preview. */
export function sampleContentFor(type: QRType): QRContent {
  return SAMPLES[type];
}
