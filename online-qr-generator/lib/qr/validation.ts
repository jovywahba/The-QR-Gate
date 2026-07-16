import { z } from "zod";
import { parseAudioUrl, parseVideoUrl } from "./embeds";
import {
  cleanWhatsAppPhone,
  normalizeFacebookUrl,
  normalizeInstagramInput,
  normalizeUrl,
} from "./payloads";
import type { ImplementedQRType, QRContent } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Zod schemas for the Part-1 content forms. Field errors surface
 * inline; `validateContent` gates Continue + download.
 * ───────────────────────────────────────────────────────────────
 */

export const websiteSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a website URL.")
    .refine((v) => normalizeUrl(v) !== null, "Enter a valid URL, e.g. example.com or https://example.com."),
  title: z.string().trim().max(120, "Keep the title under 120 characters.").optional(),
  description: z.string().trim().max(300, "Keep the description under 300 characters.").optional(),
});

export const whatsappSchema = z
  .object({
    countryCode: z
      .string()
      .trim()
      .min(1, "Enter a country code, e.g. +20.")
      .refine((v) => /^\+?[\d\s\-()]{1,6}$/.test(v) && /\d/.test(v), "Enter a valid country code, e.g. +20."),
    phone: z
      .string()
      .trim()
      .min(1, "Enter a phone number.")
      .refine((v) => /^[\d\s\-()+]+$/.test(v), "Phone numbers can only contain digits, spaces, +, -, and brackets."),
    message: z.string().trim().max(1000, "Keep the message under 1,000 characters.").optional(),
  })
  .superRefine((data, ctx) => {
    const digits = cleanWhatsAppPhone(data.countryCode, data.phone);
    if (digits && (digits.length < 6 || digits.length > 15)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "The full number (country code + phone) must be 6–15 digits.",
      });
    }
  });

export const wifiSchema = z
  .object({
    ssid: z
      .string()
      .min(1, "Enter the network name (SSID).")
      .max(32, "WiFi network names are at most 32 characters."),
    password: z.string().max(63, "WiFi passwords are at most 63 characters."),
    encryption: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.encryption === "nopass") return;
    if (!data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Enter the network password (or set encryption to None).",
      });
    } else if (data.encryption === "WPA" && data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "WPA/WPA2 passwords are at least 8 characters.",
      });
    }
  });

const optionalTrimmed = (max: number, label: string) =>
  z.string().trim().max(max, `Keep ${label} under ${max} characters.`).optional();

export const vcardSchema = z
  .object({
    firstName: z.string().trim().max(80, "Keep the first name under 80 characters."),
    lastName: z.string().trim().max(80, "Keep the last name under 80 characters."),
    company: optionalTrimmed(120, "the company"),
    jobTitle: optionalTrimmed(120, "the job title"),
    mobile: z
      .string()
      .trim()
      .refine((v) => !v || /^[\d\s\-()+]{4,20}$/.test(v), "Enter a valid mobile number.")
      .optional(),
    phone: z
      .string()
      .trim()
      .refine((v) => !v || /^[\d\s\-()+]{4,20}$/.test(v), "Enter a valid phone number.")
      .optional(),
    email: z
      .string()
      .trim()
      .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email address.")
      .optional(),
    website: z
      .string()
      .trim()
      .refine((v) => !v || normalizeUrl(v) !== null, "Enter a valid URL, e.g. example.com.")
      .optional(),
    street: optionalTrimmed(160, "the street address"),
    city: optionalTrimmed(80, "the city"),
    country: optionalTrimmed(80, "the country"),
    note: optionalTrimmed(400, "the note"),
  })
  .superRefine((data, ctx) => {
    if (!data.firstName && !data.lastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "Enter at least a first or last name.",
      });
    }
  });

/* ── Shared Part-2 helpers ── */

/** Reference to an already-uploaded qr_assets row (ownership re-checked server-side). */
export const assetRefSchema = z.object({
  assetId: z.string().uuid("Invalid file reference — upload the file again."),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1).max(120),
  previewUrl: z.string().optional(),
});

const validUrl = (message: string) =>
  z.string().trim().min(1, message).refine((v) => normalizeUrl(v) !== null, message);

const optionalValidUrl = (message: string) =>
  z
    .string()
    .trim()
    .refine((v) => !v || normalizeUrl(v) !== null, message)
    .optional()
    .or(z.literal(""));

const hostRestrictedUrl = (hosts: string[], message: string) =>
  z
    .string()
    .trim()
    .refine((v) => {
      if (!v) return true;
      const normalized = normalizeUrl(v);
      if (!normalized) return false;
      try {
        return hosts.includes(new URL(normalized).hostname.toLowerCase());
      } catch {
        return false;
      }
    }, message);

const shortText = (max: number, label: string) =>
  z.string().trim().max(max, `Keep ${label} under ${max} characters.`);

const socialPlatforms = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "linkedin",
  "youtube",
  "snapchat",
  "pinterest",
  "threads",
  "website",
] as const;

const socialItemSchema = z.object({
  id: z.string().min(1),
  platform: z.enum(socialPlatforms),
  label: shortText(60, "the label"),
  url: validUrl("Enter a valid URL for this channel."),
});

const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ── PDF ── */
export const pdfSchema = z.object({
  title: z.string().trim().min(1, "Enter a document title.").max(120),
  description: shortText(500, "the description"),
  buttonLabel: z.string().trim().min(1, "Enter a button label.").max(40),
  file: assetRefSchema.nullable().refine((v) => v !== null, "Upload a PDF file."),
});

/* ── List of Links ── */
export const linksSchema = z.object({
  title: z.string().trim().min(1, "Enter a page title.").max(80),
  description: shortText(300, "the description"),
  image: assetRefSchema.nullable(),
  links: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().trim().min(1, "Enter a label for this link.").max(80),
        url: validUrl("Enter a valid URL, e.g. example.com."),
        icon: z.string().max(40),
      }),
    )
    .min(1, "Add at least one link.")
    .max(50, "Keep it under 50 links."),
});

/* ── Business ── */
export const businessSchema = z
  .object({
    name: z.string().trim().min(1, "Enter the business name.").max(120),
    category: shortText(80, "the category"),
    headline: shortText(120, "the headline"),
    description: shortText(1000, "the description"),
    logo: assetRefSchema.nullable(),
    cover: assetRefSchema.nullable(),
    phone: z
      .string()
      .trim()
      .refine((v) => !v || /^[\d\s\-()+]{4,20}$/.test(v), "Enter a valid phone number."),
    email: z
      .string()
      .trim()
      .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email address."),
    website: optionalValidUrl("Enter a valid website URL."),
    street: shortText(160, "the street address"),
    city: shortText(80, "the city"),
    country: shortText(80, "the country"),
    hours: z.array(
      z.object({
        day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
        closed: z.boolean(),
        opens: z.string(),
        closes: z.string(),
      }),
    ),
    socials: z.array(socialItemSchema),
    ctaLabel: shortText(40, "the button label"),
    ctaUrl: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    data.hours.forEach((row, i) => {
      if (row.closed) return;
      if (!TIME_24H.test(row.opens)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["hours", i, "opens"], message: "Use HH:MM, e.g. 09:00." });
      }
      if (!TIME_24H.test(row.closes)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["hours", i, "closes"], message: "Use HH:MM, e.g. 17:00." });
      }
    });
    if (data.ctaLabel.trim() && normalizeUrl(data.ctaUrl) === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ctaUrl"], message: "Enter a valid URL for the button." });
    }
    if (!data.ctaLabel.trim() && data.ctaUrl.trim() && normalizeUrl(data.ctaUrl) === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ctaUrl"], message: "Enter a valid URL for the button." });
    }
  });

/* ── Video ── */
export const videoSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a video title.").max(120),
    mode: z.enum(["url", "upload"]),
    videoUrl: z.string().trim(),
    file: assetRefSchema.nullable(),
    thumbnail: assetRefSchema.nullable(),
    description: shortText(500, "the description"),
    ctaLabel: shortText(40, "the button label"),
    ctaUrl: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "url" && parseVideoUrl(data.videoUrl) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoUrl"],
        message: "Enter a valid https video URL (YouTube, Vimeo, or a direct video link).",
      });
    }
    if (data.mode === "upload" && !data.file) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["file"], message: "Upload a video file." });
    }
    if (data.ctaLabel.trim() && normalizeUrl(data.ctaUrl) === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ctaUrl"], message: "Enter a valid URL for the button." });
    }
  });

/* ── Images ── */
export const imagesSchema = z.object({
  title: shortText(120, "the gallery title"),
  description: shortText(500, "the description"),
  images: z
    .array(
      z.object({
        id: z.string().min(1),
        asset: assetRefSchema,
        caption: shortText(200, "the caption"),
      }),
    )
    .min(1, "Upload at least one image.")
    .max(20, "Keep it under 20 images."),
  ctaLabel: shortText(40, "the button label"),
  ctaUrl: optionalValidUrl("Enter a valid URL for the button."),
});

/* ── Facebook (direct) ── */
export const facebookSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter your Facebook page URL.")
    .refine((v) => normalizeFacebookUrl(v) !== null, "Enter a valid Facebook page URL, e.g. facebook.com/yourpage."),
  pageName: shortText(120, "the page name"),
  description: shortText(300, "the description"),
});

/* ── Instagram (direct) ── */
export const instagramSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(1, "Enter your Instagram username.")
    .refine(
      (v) => normalizeInstagramInput(v) !== null,
      "Enter a valid username (letters, numbers, dots, underscores) or profile URL.",
    ),
  title: shortText(120, "the title"),
  description: shortText(300, "the description"),
});

/* ── Social Media ── */
export const socialSchema = z.object({
  title: shortText(120, "the page title"),
  description: shortText(300, "the description"),
  image: assetRefSchema.nullable(),
  links: z.array(socialItemSchema).min(1, "Add at least one social link.").max(20, "Keep it under 20 links."),
});

/* ── MP3 ── */
export const mp3Schema = z
  .object({
    title: z.string().trim().min(1, "Enter an audio title.").max(120),
    artist: shortText(120, "the artist"),
    mode: z.enum(["url", "upload"]),
    audioUrl: z.string().trim(),
    file: assetRefSchema.nullable(),
    cover: assetRefSchema.nullable(),
    description: shortText(500, "the description"),
    allowDownload: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "url" && parseAudioUrl(data.audioUrl) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["audioUrl"],
        message: "Enter a valid https audio URL.",
      });
    }
    if (data.mode === "upload" && !data.file) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["file"], message: "Upload an MP3 file." });
    }
  });

/* ── Menu ── */
export const menuSchema = z
  .object({
    businessName: shortText(120, "the business name"),
    menuTitle: shortText(120, "the menu title"),
    description: shortText(500, "the description"),
    logo: assetRefSchema.nullable(),
    mode: z.enum(["pdf", "url"]),
    menuUrl: z.string().trim(),
    file: assetRefSchema.nullable(),
    phone: z
      .string()
      .trim()
      .refine((v) => !v || /^[\d\s\-()+]{4,20}$/.test(v), "Enter a valid phone number."),
    email: z
      .string()
      .trim()
      .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email address."),
    address: shortText(200, "the address"),
    ctaLabel: shortText(40, "the button label"),
    ctaUrl: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (!data.businessName.trim() && !data.menuTitle.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "Enter a business name or a menu title.",
      });
    }
    if (data.mode === "pdf" && !data.file) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["file"], message: "Upload the menu PDF." });
    }
    if (data.mode === "url") {
      const normalized = normalizeUrl(data.menuUrl);
      if (!normalized || !normalized.startsWith("https://")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["menuUrl"], message: "Enter a valid https menu URL." });
      }
    }
    if (data.ctaLabel.trim() && normalizeUrl(data.ctaUrl) === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ctaUrl"], message: "Enter a valid URL for the button." });
    }
  });

/* ── Apps ── */
export const appsSchema = z
  .object({
    appName: z.string().trim().min(1, "Enter the app name.").max(120),
    description: shortText(500, "the description"),
    icon: assetRefSchema.nullable(),
    appStoreUrl: hostRestrictedUrl(
      ["apps.apple.com", "itunes.apple.com"],
      "Enter a valid Apple App Store URL (apps.apple.com).",
    ),
    playStoreUrl: hostRestrictedUrl(["play.google.com"], "Enter a valid Google Play URL (play.google.com)."),
    appGalleryUrl: hostRestrictedUrl(
      ["appgallery.huawei.com", "appgallery.cloud.huawei.com"],
      "Enter a valid Huawei AppGallery URL.",
    ),
    websiteUrl: optionalValidUrl("Enter a valid website URL."),
  })
  .superRefine((data, ctx) => {
    const any =
      data.appStoreUrl.trim() || data.playStoreUrl.trim() || data.appGalleryUrl.trim() || data.websiteUrl?.trim();
    if (!any) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appStoreUrl"],
        message: "Add at least one store or website URL.",
      });
    }
  });

/* ── Coupon ── */
const DATE_YMD = /^\d{4}-\d{2}-\d{2}$/;

export const couponSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a coupon title.").max(120),
    code: z.string().trim().min(1, "Enter the coupon code.").max(40),
    description: shortText(500, "the description"),
    discountType: z.enum(["percent", "amount", "text"]),
    discountValue: z.string().trim().max(80),
    businessName: shortText(120, "the business name"),
    logo: assetRefSchema.nullable(),
    terms: shortText(1000, "the terms"),
    expiresAt: z.string().trim(),
    redemptionUrl: optionalValidUrl("Enter a valid redemption URL."),
    instructions: shortText(500, "the instructions"),
    ctaLabel: shortText(40, "the button label"),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "percent" && data.discountValue) {
      const n = Number(data.discountValue.replace(/%$/, ""));
      if (!Number.isFinite(n) || n <= 0 || n > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountValue"],
          message: "Enter a percentage between 1 and 100.",
        });
      }
    }
    if (data.expiresAt) {
      if (!DATE_YMD.test(data.expiresAt)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "Use the date picker (YYYY-MM-DD)." });
      } else {
        const d = new Date(data.expiresAt);
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "Enter a real date." });
        }
      }
    }
  });

export const contentSchemas: Record<ImplementedQRType, z.ZodTypeAny> = {
  website: websiteSchema,
  whatsapp: whatsappSchema,
  wifi: wifiSchema,
  vcard: vcardSchema,
  pdf: pdfSchema,
  links: linksSchema,
  business: businessSchema,
  video: videoSchema,
  images: imagesSchema,
  facebook: facebookSchema,
  instagram: instagramSchema,
  social: socialSchema,
  mp3: mp3Schema,
  menu: menuSchema,
  apps: appsSchema,
  coupon: couponSchema,
};

export type ContentValidation = {
  valid: boolean;
  /** field name → first error message */
  fieldErrors: Record<string, string>;
};

/** Validate a content union member; returns per-field errors for inline display. */
export function validateContent(content: QRContent): ContentValidation {
  const result = contentSchemas[content.type].safeParse(content.data);
  if (result.success) return { valid: true, fieldErrors: {} };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return { valid: false, fieldErrors };
}
