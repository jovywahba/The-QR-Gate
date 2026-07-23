import type { QRContent, QRDesignOptions, QRType, QRWizardState } from "./types";

/**
 * Default design — ink on white, square modules, Q error correction.
 * Scan reliability beats decoration: the default must decode cleanly.
 */
export const defaultDesign: QRDesignOptions = {
  dotStyle: "square",
  cornerSquareStyle: "square",
  cornerDotStyle: "square",
  foregroundColor: "#1B1B2F",
  backgroundColor: "#FFFFFF",
  gradientType: "none",
  gradientStartColor: "#1B1B2F",
  gradientEndColor: "#3B5BFF",
  gradientRotation: 45,
  margin: 4,
  errorCorrection: "Q",
  logoDataUrl: null,
  logoFileName: null,
  logoSize: 18,
  logoMargin: 4,
  logoBackground: true,
  // Templates & frames — defaults keep the classic plain QR, which is
  // also what pre-Part-6 saved designs migrate to.
  templateId: null,
  frameId: "none",
  frameText: "",
  frameBackground: "#FFFFFF",
  frameForeground: "#1B1B2F",
  frameTextColor: "#FFFFFF",
  exportFit: "square",
};

/**
 * Merge a stored design (draft/DB) into the current shape — including
 * Part-1/2 drafts that used the old field names.
 */
export function migrateDesign(stored: unknown): QRDesignOptions {
  if (!stored || typeof stored !== "object") return { ...defaultDesign };
  const raw = stored as Record<string, unknown>;
  const migrated: Partial<QRDesignOptions> = {};

  // Old → new field names (Part 1/2 drafts, detected by the old key).
  const isOldShape = typeof raw.foreground === "string";
  if (isOldShape) {
    migrated.foregroundColor = raw.foreground as string;
    if (typeof raw.background === "string") migrated.backgroundColor = raw.background;
    if (raw.cornerStyle === "rounded") {
      migrated.cornerSquareStyle = "extra-rounded";
      migrated.cornerDotStyle = "dot";
    }
    // Old margin was px at a 320 base — different scale; use the new default.
    migrated.margin = defaultDesign.margin;
  }

  const known = Object.fromEntries(
    Object.entries(raw).filter(([key]) => key in defaultDesign),
  ) as Partial<QRDesignOptions>;

  return { ...defaultDesign, ...known, ...migrated };
}

/** Stable client-side id for repeatable list rows. */
export function newItemId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

const DEFAULT_HOURS = (["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => ({
  day,
  closed: day === "sun",
  opens: "09:00",
  closes: "17:00",
}));

/** Fresh content for a type's Step-2 form. Exhaustive over all 16 types. */
export function defaultContentFor(type: QRType): QRContent {
  switch (type) {
    case "website":
      return { type: "website", data: { url: "", title: "", description: "" } };
    case "whatsapp":
      return { type: "whatsapp", data: { countryCode: "", phone: "", message: "" } };
    case "wifi":
      return { type: "wifi", data: { ssid: "", password: "", encryption: "WPA", hidden: false } };
    case "vcard":
      return {
        type: "vcard",
        data: {
          firstName: "",
          lastName: "",
          company: "",
          jobTitle: "",
          mobile: "",
          phone: "",
          email: "",
          website: "",
          street: "",
          city: "",
          country: "",
          note: "",
        },
      };
    case "pdf":
      return { type: "pdf", data: { title: "", description: "", buttonLabel: "Open PDF", file: null } };
    case "links":
      return {
        type: "links",
        data: {
          title: "",
          description: "",
          image: null,
          links: [{ id: newItemId(), label: "", url: "", icon: "link" }],
        },
      };
    case "business":
      return {
        type: "business",
        data: {
          name: "",
          category: "",
          headline: "",
          description: "",
          logo: null,
          cover: null,
          phone: "",
          email: "",
          website: "",
          street: "",
          city: "",
          country: "",
          hours: DEFAULT_HOURS.map((h) => ({ ...h })),
          socials: [],
          ctaLabel: "",
          ctaUrl: "",
        },
      };
    case "video":
      return {
        type: "video",
        data: {
          title: "",
          mode: "url",
          videoUrl: "",
          file: null,
          thumbnail: null,
          description: "",
          ctaLabel: "",
          ctaUrl: "",
        },
      };
    case "images":
      return { type: "images", data: { title: "", description: "", images: [], ctaLabel: "", ctaUrl: "" } };
    case "facebook":
      return { type: "facebook", data: { url: "", pageName: "", description: "" } };
    case "instagram":
      return { type: "instagram", data: { handle: "", title: "", description: "" } };
    case "social":
      return {
        type: "social",
        data: {
          title: "",
          description: "",
          image: null,
          links: [{ id: newItemId(), platform: "instagram", label: "", url: "" }],
        },
      };
    case "mp3":
      return {
        type: "mp3",
        data: {
          title: "",
          artist: "",
          mode: "url",
          audioUrl: "",
          file: null,
          cover: null,
          description: "",
          allowDownload: false,
        },
      };
    case "menu":
      return {
        type: "menu",
        data: {
          businessName: "",
          menuTitle: "",
          description: "",
          logo: null,
          mode: "pdf",
          menuUrl: "",
          file: null,
          phone: "",
          email: "",
          address: "",
          ctaLabel: "",
          ctaUrl: "",
        },
      };
    case "apps":
      return {
        type: "apps",
        data: {
          appName: "",
          description: "",
          icon: null,
          appStoreUrl: "",
          playStoreUrl: "",
          appGalleryUrl: "",
          websiteUrl: "",
        },
      };
    case "coupon":
      return {
        type: "coupon",
        data: {
          title: "",
          code: "",
          description: "",
          discountType: "percent",
          discountValue: "",
          businessName: "",
          logo: null,
          terms: "",
          expiresAt: "",
          redemptionUrl: "",
          instructions: "",
          ctaLabel: "Redeem offer",
        },
      };
  }
}

export function initialWizardState(): QRWizardState {
  return {
    step: 1,
    selectedType: null,
    content: null,
    design: defaultDesign,
    generatedPayload: "",
    publishingStatus: "idle",
    trackingEnabled: false,
  };
}
