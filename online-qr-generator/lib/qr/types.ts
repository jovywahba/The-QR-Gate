import type { LucideIcon } from "lucide-react";

/**
 * ───────────────────────────────────────────────────────────────
 * Core QR engine types. `lib/qr/registry.ts` is the single source
 * of truth for the 16 QR types; everything else derives from here.
 * ───────────────────────────────────────────────────────────────
 */

/** Every QR type the product offers. Order here is not display order. */
export type QRType =
  | "website"
  | "pdf"
  | "links"
  | "vcard"
  | "business"
  | "video"
  | "images"
  | "facebook"
  | "instagram"
  | "social"
  | "whatsapp"
  | "mp3"
  | "menu"
  | "apps"
  | "coupon"
  | "wifi";

/**
 * direct  = the QR encodes the final payload itself (URL, WIFI:, vCard…).
 * hosted  = the QR points at a mobile landing page we host (Parts 2–4).
 */
export type QRCategory = "direct" | "hosted";

export type QRTypeDefinition = {
  id: QRType;
  name: string;
  description: string;
  category: QRCategory;
  icon: LucideIcon;
  defaultContent: unknown;
  /** Content form + payload shipped? The four direct Part-1 types are; the rest land in Part 2. */
  implemented: boolean;
};

/* ── Type-specific content (discriminated union, no options-bag) ── */

export type WebsiteContent = {
  /** As typed by the user — normalized at payload time. */
  url: string;
  title?: string;
  description?: string;
};

export type WhatsAppContent = {
  /** e.g. "+20" — punctuation tolerated, digits extracted at payload time. */
  countryCode: string;
  phone: string;
  message?: string;
};

export type WiFiEncryption = "WPA" | "WEP" | "nopass";

export type WiFiContent = {
  ssid: string;
  /** NEVER persisted or logged — memory only (see persistence.ts). */
  password: string;
  encryption: WiFiEncryption;
  hidden: boolean;
};

export type VCardContent = {
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  website?: string;
  street?: string;
  city?: string;
  country?: string;
  note?: string;
};

/* ── Uploaded-file reference (the file itself lives in Supabase Storage) ── */

export type AssetRef = {
  /** qr_assets.id — ownership is re-verified server-side at publish. */
  assetId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  /**
   * Transient signed URL for the owner's preview. NEVER persisted
   * (persistence strips it) and never encoded into a QR.
   */
  previewUrl?: string;
};

export type PDFContent = {
  title: string;
  description: string;
  buttonLabel: string;
  file: AssetRef | null;
};

export type LinkItem = {
  /** Client-side id for list editing (crypto UUID). */
  id: string;
  label: string;
  url: string;
  icon: string;
};

export type LinksContent = {
  title: string;
  description: string;
  image: AssetRef | null;
  links: LinkItem[];
};

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type OpeningHoursRow = {
  day: WeekDay;
  closed: boolean;
  /** "09:00" 24h — ignored when closed. */
  opens: string;
  closes: string;
};

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x"
  | "linkedin"
  | "youtube"
  | "snapchat"
  | "pinterest"
  | "threads"
  | "website";

export type SocialItem = {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
};

export type BusinessContent = {
  name: string;
  category: string;
  headline: string;
  description: string;
  logo: AssetRef | null;
  cover: AssetRef | null;
  phone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  country: string;
  hours: OpeningHoursRow[];
  socials: SocialItem[];
  ctaLabel: string;
  ctaUrl: string;
};

export type VideoContent = {
  title: string;
  mode: "url" | "upload";
  videoUrl: string;
  file: AssetRef | null;
  thumbnail: AssetRef | null;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
};

export type GalleryImage = {
  id: string;
  asset: AssetRef;
  caption: string;
};

export type ImagesContent = {
  title: string;
  description: string;
  images: GalleryImage[];
  ctaLabel: string;
  ctaUrl: string;
};

export type FacebookContent = {
  /** Page URL or bare page name — normalized at payload time. */
  url: string;
  pageName: string;
  description: string;
};

export type InstagramContent = {
  /** "@example", "example", or a profile URL — normalized at payload time. */
  handle: string;
  title: string;
  description: string;
};

export type SocialContent = {
  title: string;
  description: string;
  image: AssetRef | null;
  links: SocialItem[];
};

export type MP3Content = {
  title: string;
  artist: string;
  mode: "url" | "upload";
  audioUrl: string;
  file: AssetRef | null;
  cover: AssetRef | null;
  description: string;
  allowDownload: boolean;
};

export type MenuContent = {
  businessName: string;
  menuTitle: string;
  description: string;
  logo: AssetRef | null;
  mode: "pdf" | "url";
  menuUrl: string;
  file: AssetRef | null;
  phone: string;
  email: string;
  address: string;
  ctaLabel: string;
  ctaUrl: string;
};

export type AppsContent = {
  appName: string;
  description: string;
  icon: AssetRef | null;
  appStoreUrl: string;
  playStoreUrl: string;
  appGalleryUrl: string;
  websiteUrl: string;
};

export type CouponDiscountType = "percent" | "amount" | "text";

export type CouponContent = {
  title: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  businessName: string;
  logo: AssetRef | null;
  terms: string;
  /** YYYY-MM-DD, or "" for no expiry. */
  expiresAt: string;
  redemptionUrl: string;
  instructions: string;
  ctaLabel: string;
};

/** Every QR type's content — a strict discriminated union, no options-bag. */
export type QRContent =
  | { type: "website"; data: WebsiteContent }
  | { type: "whatsapp"; data: WhatsAppContent }
  | { type: "wifi"; data: WiFiContent }
  | { type: "vcard"; data: VCardContent }
  | { type: "pdf"; data: PDFContent }
  | { type: "links"; data: LinksContent }
  | { type: "business"; data: BusinessContent }
  | { type: "video"; data: VideoContent }
  | { type: "images"; data: ImagesContent }
  | { type: "facebook"; data: FacebookContent }
  | { type: "instagram"; data: InstagramContent }
  | { type: "social"; data: SocialContent }
  | { type: "mp3"; data: MP3Content }
  | { type: "menu"; data: MenuContent }
  | { type: "apps"; data: AppsContent }
  | { type: "coupon"; data: CouponContent };

/** All 16 types have content forms now — alias kept for Part-1 call sites. */
export type ImplementedQRType = QRContent["type"];

/* ── Design options (the Step-3 editor) ── */

export type QRDotStyle = "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
export type QRCornerSquareStyle = "square" | "dot" | "rounded" | "extra-rounded";
export type QRCornerDotStyle = "square" | "dot" | "rounded";
export type QRGradientType = "none" | "linear" | "radial";
export type QRErrorCorrection = "L" | "M" | "Q" | "H";

export type QRDesignOptions = {
  dotStyle: QRDotStyle;
  cornerSquareStyle: QRCornerSquareStyle;
  cornerDotStyle: QRCornerDotStyle;

  /** Hex colors. Readability engine guards the contrast. */
  foregroundColor: string;
  backgroundColor: string;

  /** Gradient applies to the QR dots themselves (renderer-level, not CSS). */
  gradientType: QRGradientType;
  gradientStartColor: string;
  gradientEndColor: string;
  /** Degrees, linear only. */
  gradientRotation: number;

  /** Quiet zone in % of the QR size (2–20; scales identically preview↔export). */
  margin: number;
  errorCorrection: QRErrorCorrection;

  /** Logo lives locally (validated data URL) — no Supabase needed. */
  logoDataUrl: string | null;
  logoFileName: string | null;
  /** % of QR width (10–25). */
  logoSize: number;
  /** Clear space around the logo, px at preview scale (0–12). */
  logoMargin: number;
  /** Clear the QR dots behind the logo. */
  logoBackground: boolean;
};

/* ── Wizard state ── */

export type WizardStep = 1 | 2 | 3 | 4;

export const WIZARD_STEPS: ReadonlyArray<{ step: WizardStep; name: string }> = [
  { step: 1, name: "Select QR Type" },
  { step: 2, name: "Add Content" },
  { step: 3, name: "Design QR Code" },
  { step: 4, name: "Download QR Code" },
];

export type PublishingStatus = "idle" | "saving" | "published" | "error" | "local-only";

export type QRWizardState = {
  step: WizardStep;
  selectedType: QRType | null;
  /** null until a type is selected. */
  content: QRContent | null;
  design: QRDesignOptions;
  /** "" when the content is invalid/empty — nothing renders, download disabled. */
  generatedPayload: string;
  publishingStatus: PublishingStatus;
  /** Server-side draft row backing hosted uploads/publishing. */
  qrCodeId?: string;
  /** The published /q/[slug] URL — the ONLY payload hosted types encode. */
  publicUrl?: string;
  slug?: string;
};
