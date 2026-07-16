import { describe, expect, it } from "vitest";
import { defaultContentFor } from "../defaults";
import { buildPayload, requiresPublishing } from "../payloads";
import { toSafeDraft } from "../persistence";
import { collectAssetRefs, displayNameFor, extractLinkItems, extractSocialItems, sanitizeContentForStorage } from "../publishing";
import { QR_TYPES } from "../registry";
import type { AssetRef, QRContent, QRType, QRWizardState } from "../types";
import { contentSchemas } from "../validation";
import { initialWizardState } from "../defaults";

const ALL_TYPES = QR_TYPES.map((t) => t.id);

const ASSET: AssetRef = {
  assetId: "33333333-3333-4333-8333-333333333333",
  fileName: "doc.pdf",
  fileSize: 1234,
  mimeType: "application/pdf",
  previewUrl: "https://signed.example.com/secret-token",
};

function pdfContent(): QRContent {
  return { type: "pdf", data: { title: "Doc", description: "", buttonLabel: "Open PDF", file: ASSET } };
}

describe("registry completeness (all 16 types)", () => {
  it("every type has a Zod schema", () => {
    for (const type of ALL_TYPES) {
      expect(contentSchemas[type], `schema for ${type}`).toBeDefined();
    }
  });

  it("every type has default content matching its type", () => {
    for (const type of ALL_TYPES) {
      const content = defaultContentFor(type);
      expect(content.type).toBe(type);
      expect(content.data).toBeTruthy();
    }
  });

  it("every type has a preview adapter, and the preview panel renders each one", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const previewsDir = path.resolve(__dirname, "../../../components/qr-generator/previews");
    const previewFiles: Record<QRType, string> = {
      website: "website-preview.tsx",
      whatsapp: "whatsapp-preview.tsx",
      wifi: "wifi-preview.tsx",
      vcard: "vcard-preview.tsx",
      pdf: "pdf-preview.tsx",
      links: "links-preview.tsx",
      business: "business-preview.tsx",
      video: "video-preview.tsx",
      images: "images-preview.tsx",
      facebook: "facebook-preview.tsx",
      instagram: "instagram-preview.tsx",
      social: "social-preview.tsx",
      mp3: "audio-preview.tsx",
      menu: "menu-preview.tsx",
      apps: "apps-preview.tsx",
      coupon: "coupon-preview.tsx",
    };
    const panel = fs.readFileSync(
      path.resolve(previewsDir, "../qr-preview-panel.tsx"),
      "utf8",
    );
    for (const type of ALL_TYPES) {
      expect(fs.existsSync(path.join(previewsDir, previewFiles[type])), `preview file for ${type}`).toBe(true);
      expect(panel, `panel renders ${type} preview`).toContain(`content?.type === "${type}"`);
    }
  });
});

describe("payload routing (direct vs hosted)", () => {
  it("classifies hosted types", () => {
    for (const type of ["pdf", "links", "business", "images", "social", "apps", "coupon"] as const) {
      expect(requiresPublishing(defaultContentFor(type)), type).toBe(true);
    }
    for (const type of ["website", "whatsapp", "wifi", "vcard", "facebook", "instagram"] as const) {
      expect(requiresPublishing(defaultContentFor(type)), type).toBe(false);
    }
  });

  it("video/mp3 are direct in URL mode, hosted in upload mode", () => {
    const video = defaultContentFor("video");
    expect(requiresPublishing(video)).toBe(false);
    if (video.type === "video") {
      expect(requiresPublishing({ type: "video", data: { ...video.data, mode: "upload" } })).toBe(true);
    }
    const mp3 = defaultContentFor("mp3");
    expect(requiresPublishing(mp3)).toBe(false);
    if (mp3.type === "mp3") {
      expect(requiresPublishing({ type: "mp3", data: { ...mp3.data, mode: "upload" } })).toBe(true);
    }
  });

  it("menu is hosted for PDFs or when business extras exist; direct for a bare URL", () => {
    const menu = defaultContentFor("menu");
    if (menu.type !== "menu") throw new Error("unreachable");
    expect(requiresPublishing(menu)).toBe(true); // default mode = pdf
    const bareUrl = { ...menu.data, mode: "url" as const, menuUrl: "https://example.com/menu" };
    expect(requiresPublishing({ type: "menu", data: bareUrl })).toBe(false);
    expect(requiresPublishing({ type: "menu", data: { ...bareUrl, businessName: "Bistro" } })).toBe(true);
  });

  it("direct payloads build locally; hosted payloads stay empty until published", () => {
    expect(buildPayload({ type: "facebook", data: { url: "facebook.com/x", pageName: "", description: "" } })).toBe(
      "https://www.facebook.com/x",
    );
    expect(
      buildPayload({ type: "instagram", data: { handle: "@x_y", title: "", description: "" } }),
    ).toBe("https://www.instagram.com/x_y/");
    const video = defaultContentFor("video");
    if (video.type === "video") {
      expect(
        buildPayload({ type: "video", data: { ...video.data, videoUrl: "https://youtu.be/dQw4w9WgXcQ" } }),
      ).toBe("https://youtu.be/dQw4w9WgXcQ");
    }
    // Hosted: NEVER a locally-built payload — publish supplies /q/[slug].
    expect(buildPayload(pdfContent())).toBe("");
    expect(buildPayload(defaultContentFor("coupon"))).toBe("");
  });
});

describe("server-side publish validation gate", () => {
  it("rejects invalid payloads exactly like the publish route does", () => {
    expect(contentSchemas.pdf.safeParse({ title: "", description: "", buttonLabel: "", file: null }).success).toBe(false);
    expect(contentSchemas.links.safeParse({ title: "T", description: "", image: null, links: [] }).success).toBe(false);
    expect(
      contentSchemas.apps.safeParse({
        appName: "App",
        description: "",
        icon: null,
        appStoreUrl: "https://example.com/not-a-store",
        playStoreUrl: "",
        appGalleryUrl: "",
        websiteUrl: "",
      }).success,
    ).toBe(false);
    expect(
      contentSchemas.apps.safeParse({
        appName: "App",
        description: "",
        icon: null,
        appStoreUrl: "https://apps.apple.com/app/id123",
        playStoreUrl: "",
        appGalleryUrl: "",
        websiteUrl: "",
      }).success,
    ).toBe(true);
    expect(contentSchemas.pdf.safeParse(pdfContent().data).success).toBe(true);
  });
});

describe("publishing serialization", () => {
  it("collects every asset reference", () => {
    expect(collectAssetRefs(pdfContent()).map((r) => r.assetId)).toEqual([ASSET.assetId]);
    const images: QRContent = {
      type: "images",
      data: {
        title: "",
        description: "",
        images: [
          { id: "a", asset: ASSET, caption: "" },
          { id: "b", asset: { ...ASSET, assetId: "44444444-4444-4444-8444-444444444444" }, caption: "" },
        ],
        ctaLabel: "",
        ctaUrl: "",
      },
    };
    expect(collectAssetRefs(images)).toHaveLength(2);
  });

  it("extracts relational link/social items with sort order", () => {
    const links: QRContent = {
      type: "links",
      data: {
        title: "T",
        description: "",
        image: null,
        links: [
          { id: "1", label: "A", url: "https://a.com", icon: "link" },
          { id: "2", label: "B", url: "https://b.com", icon: "globe" },
        ],
      },
    };
    expect(extractLinkItems(links)).toEqual([
      { label: "A", url: "https://a.com", icon: "link", sort_order: 0 },
      { label: "B", url: "https://b.com", icon: "globe", sort_order: 1 },
    ]);
    const social: QRContent = {
      type: "social",
      data: {
        title: "",
        description: "",
        image: null,
        links: [{ id: "1", platform: "tiktok", label: "", url: "https://tiktok.com/@x" }],
      },
    };
    expect(extractSocialItems(social)).toEqual([
      { platform: "tiktok", label: null, url: "https://tiktok.com/@x", sort_order: 0 },
    ]);
  });

  it("strips transient signed URLs before storage AND before drafts", () => {
    const stored = sanitizeContentForStorage(pdfContent());
    expect(JSON.stringify(stored)).not.toContain("secret-token");

    const state: QRWizardState = {
      ...initialWizardState(),
      step: 2,
      selectedType: "pdf",
      content: pdfContent(),
      generatedPayload: "",
    };
    expect(JSON.stringify(toSafeDraft(state))).not.toContain("secret-token");
  });

  it("derives display names", () => {
    expect(displayNameFor(pdfContent())).toBe("Doc");
    expect(displayNameFor({ type: "instagram", data: { handle: "@x", title: "", description: "" } })).toBe("@x");
  });
});
