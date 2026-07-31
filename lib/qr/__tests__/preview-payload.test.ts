import { afterEach, describe, expect, it } from "vitest";
import { demoFixtureFor } from "../demo-fixtures";
import { buildPayload, requiresPublishing } from "../payloads";
import {
  DESIGN_PREVIEW_PATH,
  designPreviewPayload,
  isDesignPreviewPayload,
  previewOrigin,
  PROD_ORIGIN,
  resolvePreviewPayload,
} from "../preview-payload";
import { publicQrUrl } from "../public-url";
import { QR_TYPES } from "../registry";
import { encodesServerUrl, resolveTrackingMode } from "../tracking";
import type { QRContent } from "../types";

/**
 * Regression coverage for the Step-3 hosted-QR preview fix.
 *
 * The bug: hosted QR types (PDF, links, business, images, …) showed an
 * EMPTY QR preview during design ("This QR type lives on a hosted page …")
 * because their real /q/[slug] URL doesn't exist until publish. The fix
 * renders a safe, decodable, OWNED design-preview payload — never localhost,
 * never a guessed /q/[slug] — swapped for the real URL after publish.
 */

const ORIGIN_KEYS = ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL"] as const;
const savedEnv: Record<string, string | undefined> = {};

function setOrigin(appUrl?: string) {
  for (const k of ORIGIN_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  if (appUrl !== undefined) process.env.NEXT_PUBLIC_APP_URL = appUrl;
}

afterEach(() => {
  for (const k of ORIGIN_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

/** Mirror of the wizard's derivePayload for the real (downloadable) payload. */
function realPayloadFor(content: QRContent): string {
  const mode = resolveTrackingMode(content, false);
  return encodesServerUrl(mode) ? "" : buildPayload(content);
}

describe("design-preview payload — safety invariants", () => {
  it("is a real, owned https URL on the /design-preview path", () => {
    const payload = designPreviewPayload();
    const url = new URL(payload);
    expect(url.protocol).toBe("https:");
    expect(url.pathname).toBe(DESIGN_PREVIEW_PATH);
  });

  it("is NEVER localhost, even when the app origin is a dev host", () => {
    for (const dev of ["http://localhost:3000", "http://127.0.0.1:3000"]) {
      setOrigin(dev);
      const payload = designPreviewPayload();
      expect(payload.includes("localhost")).toBe(false);
      expect(payload.includes("127.0.0.1")).toBe(false);
      expect(payload.startsWith(PROD_ORIGIN)).toBe(true);
    }
  });

  it("is NEVER a guessed /q/[slug] (distinct path)", () => {
    expect(designPreviewPayload().includes("/q/")).toBe(false);
    expect(isDesignPreviewPayload(designPreviewPayload())).toBe(true);
    // A real published URL is NOT a design preview.
    expect(isDesignPreviewPayload(publicQrUrl("aB3xY9kL"))).toBe(false);
  });

  it("uses the configured origin when it is a real public host", () => {
    setOrigin("https://qr.example.com");
    expect(previewOrigin()).toBe("https://qr.example.com");
    expect(designPreviewPayload()).toBe(`https://qr.example.com${DESIGN_PREVIEW_PATH}`);
  });

  it("falls back to the production origin when unset/malformed", () => {
    setOrigin("not a url");
    expect(previewOrigin()).toBe(PROD_ORIGIN);
  });
});

describe("resolvePreviewPayload — three modes", () => {
  it("renders the real payload (live) whenever one exists", () => {
    const r = resolvePreviewPayload({
      generatedPayload: "https://example.com",
      hasType: true,
      needsPublishing: false,
    });
    expect(r).toEqual({ payload: "https://example.com", mode: "live" });
  });

  it("shows the design preview for a hosted type before publish", () => {
    const r = resolvePreviewPayload({ generatedPayload: "", hasType: true, needsPublishing: true });
    expect(r.mode).toBe("design-preview");
    expect(isDesignPreviewPayload(r.payload)).toBe(true);
  });

  it("is empty for a direct type with no valid content yet", () => {
    const r = resolvePreviewPayload({ generatedPayload: "", hasType: true, needsPublishing: false });
    expect(r).toEqual({ payload: "", mode: "empty" });
  });

  it("is empty before a type is selected", () => {
    expect(resolvePreviewPayload({ generatedPayload: "", hasType: false, needsPublishing: true }).mode).toBe(
      "empty",
    );
  });

  it("a real published URL takes precedence over the design preview (post-publish swap)", () => {
    const real = publicQrUrl("aB3xY9kL");
    const r = resolvePreviewPayload({ generatedPayload: real, hasType: true, needsPublishing: true });
    expect(r).toEqual({ payload: real, mode: "live" });
    expect(isDesignPreviewPayload(r.payload)).toBe(false);
  });
});

describe("per-type preview parity (real registry + demo fixtures)", () => {
  it("every hosted type shows a design-preview QR before publish; direct/native show their real payload", () => {
    for (const t of QR_TYPES) {
      const content = demoFixtureFor(t.id);
      const hosted = requiresPublishing(content);
      const generatedPayload = realPayloadFor(content);
      const r = resolvePreviewPayload({ generatedPayload, hasType: true, needsPublishing: hosted });

      if (hosted) {
        // No real URL yet → a safe, owned, decodable design preview.
        expect(r.mode, t.id).toBe("design-preview");
        expect(isDesignPreviewPayload(r.payload), t.id).toBe(true);
        expect(r.payload.includes("localhost"), t.id).toBe(false);
        expect(r.payload.includes("/q/"), t.id).toBe(false);
      } else {
        // Direct/native → the real payload that decodes to the destination.
        expect(r.mode, t.id).toBe("live");
        expect(r.payload, t.id).toBe(generatedPayload);
        expect(r.payload.length, t.id).toBeGreaterThan(0);
      }
    }
  });

  it("classifies the canonical hosted vs direct anchors correctly", () => {
    // Always hosted (a /q/[slug] page is created on publish).
    for (const id of ["pdf", "links", "business", "images", "social", "apps", "coupon"] as const) {
      expect(requiresPublishing(demoFixtureFor(id)), id).toBe(true);
    }
    // Always direct/native (their real payload is available immediately).
    for (const id of ["website", "whatsapp", "facebook", "instagram", "wifi", "vcard"] as const) {
      expect(requiresPublishing(demoFixtureFor(id)), id).toBe(false);
      expect(buildPayload(demoFixtureFor(id)).length, id).toBeGreaterThan(0);
    }
  });

  it("hosted download stays blocked before publish (no real payload to encode)", () => {
    const pdf = demoFixtureFor("pdf");
    // The DOWNLOAD path uses the real payload, which is empty until publish.
    expect(realPayloadFor(pdf)).toBe("");
    // The PREVIEW, however, is populated (design-preview) so the editor works.
    expect(resolvePreviewPayload({ generatedPayload: "", hasType: true, needsPublishing: true }).mode).toBe(
      "design-preview",
    );
  });
});
