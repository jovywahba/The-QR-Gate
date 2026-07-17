import type { AssetRef, QRContent, QRType } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Live-demo fixtures — used ONLY on the homepage hover, always shown
 * behind a "Live demo" badge. Every fixture points at a REAL file
 * under public/demo-previews/ or a REAL public URL. No fabricated
 * stats (followers, ratings, counts) anywhere — the demo mirrors
 * exactly what the real content path renders, just with our own
 * illustrative data. Never written to wizard state, drafts, or
 * Supabase.
 * ───────────────────────────────────────────────────────────────
 */

const SITE = "https://the-qr-gate.vercel.app";

function fileAsset(fileName: string, previewUrl: string, mimeType: string, fileSize: number): AssetRef {
  return { assetId: `demo-${fileName}`, fileName, fileSize, mimeType, previewUrl };
}

const AVATAR = fileAsset("avatar.svg", "/demo-previews/avatar.svg", "image/svg+xml", 426);
const LOGO = fileAsset("logo.svg", "/demo-previews/logo.svg", "image/svg+xml", 426);
const COVER = fileAsset("cover.svg", "/demo-previews/cover.svg", "image/svg+xml", 277);
const ALBUM = fileAsset("album.svg", "/demo-previews/album.svg", "image/svg+xml", 277);
const GALLERY = [1, 2, 3, 4].map((n) =>
  fileAsset(`gallery-${n}.svg`, `/demo-previews/gallery-${n}.svg`, "image/svg+xml", 277),
);

const FIXTURES: Record<QRType, QRContent> = {
  website: {
    type: "website",
    // A real, embeddable page — the metadata card / iframe fetch it live.
    data: { url: SITE, title: "", description: "" },
  },
  pdf: {
    type: "pdf",
    data: {
      title: "Live demo document",
      description: "A real PDF rendered right in the preview.",
      buttonLabel: "Open PDF",
      file: fileAsset("document.pdf", "/demo-previews/document.pdf", "application/pdf", 687),
    },
  },
  links: {
    type: "links",
    data: {
      title: "The QR Gate",
      description: "Everything, one scan away.",
      image: AVATAR,
      links: [
        { id: "d1", label: "Website", url: SITE, icon: "globe" },
        { id: "d2", label: "Source on GitHub", url: "https://github.com/jovywahba/The-QR-Gate", icon: "link" },
        { id: "d3", label: "Create a QR code", url: `${SITE}/create`, icon: "link" },
      ],
    },
  },
  vcard: {
    type: "vcard",
    // Real, owned identity — no invented phone/email.
    data: {
      firstName: "The QR Gate",
      lastName: "",
      company: "The QR Gate",
      jobTitle: "QR code generator",
      mobile: "",
      phone: "",
      email: "",
      website: SITE,
      street: "",
      city: "",
      country: "",
      note: "Create, customize, and share QR codes.",
    },
  },
  business: {
    type: "business",
    data: {
      name: "The QR Gate",
      category: "QR code studio",
      headline: "Create, customize, and share.",
      description: "16 QR types, a live design editor, and instant sharing.",
      logo: LOGO,
      cover: COVER,
      phone: "",
      email: "",
      website: SITE,
      street: "",
      city: "",
      country: "",
      hours: [],
      socials: [{ id: "s", platform: "website", label: "Website", url: SITE }],
      ctaLabel: "Open The QR Gate",
      ctaUrl: SITE,
    },
  },
  video: {
    type: "video",
    // Real public, embeddable, openly-licensed film (Blender's Big Buck Bunny).
    data: {
      title: "Big Buck Bunny (open movie)",
      mode: "url",
      videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      file: null,
      thumbnail: null,
      description: "Played through YouTube's official embed.",
      ctaLabel: "",
      ctaUrl: "",
    },
  },
  images: {
    type: "images",
    data: {
      title: "Gradient set",
      description: "Real local demo images.",
      images: GALLERY.map((asset, i) => ({ id: `g${i}`, asset, caption: `Swatch ${i + 1}` })),
      ctaLabel: "",
      ctaUrl: "",
    },
  },
  facebook: {
    type: "facebook",
    // A real public Page — the official Page Plugin embeds it, or we fall
    // back to a metadata/open card if framing is blocked.
    data: { url: "https://www.facebook.com/facebook", pageName: "Facebook", description: "" },
  },
  instagram: {
    type: "instagram",
    // Instagram profiles can't be embedded — a real handle + open + note.
    data: { handle: "@instagram", title: "Instagram", description: "" },
  },
  social: {
    type: "social",
    data: {
      title: "The QR Gate",
      description: "Find us here.",
      image: AVATAR,
      links: [
        { id: "s1", platform: "website", label: "Website", url: SITE },
        { id: "s2", platform: "youtube", label: "Open movie", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" },
      ],
    },
  },
  whatsapp: {
    type: "whatsapp",
    // The wa.me link is real + functional; number/message are demo values.
    data: { countryCode: "+1", phone: "555 0100", message: "Hi! This is a Live demo message from The QR Gate." },
  },
  mp3: {
    type: "mp3",
    data: {
      title: "Demo tone",
      artist: "The QR Gate",
      mode: "upload",
      audioUrl: "",
      file: fileAsset("audio.wav", "/demo-previews/audio.wav", "audio/wav", 24044),
      cover: ALBUM,
      description: "A real 3-second audio file.",
      allowDownload: true,
    },
  },
  menu: {
    type: "menu",
    data: {
      businessName: "The QR Gate Café",
      menuTitle: "Demo menu",
      description: "A real PDF menu fixture.",
      logo: LOGO,
      mode: "pdf",
      menuUrl: "",
      file: fileAsset("menu.pdf", "/demo-previews/menu.pdf", "application/pdf", 687),
      phone: "",
      email: "",
      address: "",
      ctaLabel: "",
      ctaUrl: "",
    },
  },
  apps: {
    type: "apps",
    // Real App Store URL — the app-store route fetches real metadata via
    // Apple's iTunes Lookup API.
    data: {
      appName: "",
      description: "",
      icon: null,
      appStoreUrl: "https://apps.apple.com/us/app/testflight/id899247664",
      playStoreUrl: "",
      appGalleryUrl: "",
      websiteUrl: "",
    },
  },
  coupon: {
    type: "coupon",
    data: {
      title: "Live demo offer",
      code: "QRGATE10",
      description: "A real, copyable coupon fixture.",
      discountType: "percent",
      discountValue: "10",
      businessName: "The QR Gate",
      logo: LOGO,
      terms: "Demo coupon — for preview only.",
      expiresAt: "2027-12-31",
      redemptionUrl: SITE,
      ctaLabel: "Redeem",
      instructions: "Show this code at checkout.",
    },
  },
  wifi: {
    type: "wifi",
    data: { ssid: "The QR Gate Guest", password: "demo-password", encryption: "WPA", hidden: false },
  },
};

/** The Live-demo fixture for a QR type (homepage hover only). */
export function demoFixtureFor(type: QRType): QRContent {
  return FIXTURES[type];
}
