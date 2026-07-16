import { describe, expect, it } from "vitest";
import { couponDiscountLabel, isCouponExpired } from "../coupon";
import { parseAudioUrl, parseVideoUrl } from "../embeds";
import { normalizeFacebookUrl, normalizeInstagramInput } from "../payloads";
import { publicQrUrl } from "../public-url";
import { generateSlug, isValidSlug, SLUG_LENGTH } from "../slug";
import {
  buildStoragePath,
  checkMagicBytes,
  checkUploadMetadata,
  isOwnedStoragePath,
  sanitizeFileName,
  sniffMagicBytes,
} from "../uploads";

describe("Facebook URL normalization", () => {
  it("normalizes facebook.com URLs", () => {
    expect(normalizeFacebookUrl("https://facebook.com/example")).toBe("https://www.facebook.com/example");
    expect(normalizeFacebookUrl("https://www.facebook.com/example")).toBe("https://www.facebook.com/example");
    expect(normalizeFacebookUrl("m.facebook.com/example")).toBe("https://www.facebook.com/example");
    expect(normalizeFacebookUrl("fb.com/example/")).toBe("https://www.facebook.com/example");
  });

  it("accepts bare page names", () => {
    expect(normalizeFacebookUrl("example")).toBe("https://www.facebook.com/example");
    expect(normalizeFacebookUrl("my.page-name")).toBe("https://www.facebook.com/my.page-name");
  });

  it("rejects non-Facebook hosts and empty paths", () => {
    expect(normalizeFacebookUrl("https://example.com/page")).toBeNull();
    expect(normalizeFacebookUrl("https://facebook.evil.com/x")).toBeNull();
    expect(normalizeFacebookUrl("https://facebook.com/")).toBeNull();
    expect(normalizeFacebookUrl("")).toBeNull();
  });
});

describe("Instagram normalization", () => {
  it("normalizes @handle, bare handle, and profile URLs", () => {
    expect(normalizeInstagramInput("@example")).toBe("https://www.instagram.com/example/");
    expect(normalizeInstagramInput("example")).toBe("https://www.instagram.com/example/");
    expect(normalizeInstagramInput("https://instagram.com/example")).toBe("https://www.instagram.com/example/");
    expect(normalizeInstagramInput("www.instagram.com/example/")).toBe("https://www.instagram.com/example/");
    expect(normalizeInstagramInput("ex.am_ple")).toBe("https://www.instagram.com/ex.am_ple/");
  });

  it("rejects invalid usernames", () => {
    expect(normalizeInstagramInput("")).toBeNull();
    expect(normalizeInstagramInput("has space")).toBeNull();
    expect(normalizeInstagramInput("bad!char")).toBeNull();
    expect(normalizeInstagramInput(".leading")).toBeNull();
    expect(normalizeInstagramInput("trailing.")).toBeNull();
    expect(normalizeInstagramInput("dou..ble")).toBeNull();
    expect(normalizeInstagramInput("x".repeat(31))).toBeNull();
    expect(normalizeInstagramInput("https://example.com/user")).toBeNull();
  });
});

describe("video URL parsing (safe embeds only)", () => {
  it("parses YouTube watch/short/share URLs into youtube-nocookie embeds", () => {
    for (const input of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://youtube.com/shorts/dQw4w9WgXcQ",
    ]) {
      const parsed = parseVideoUrl(input);
      expect(parsed?.provider).toBe("youtube");
      expect(parsed?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
      expect(parsed?.watchUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    }
  });

  it("parses Vimeo URLs into player.vimeo embeds", () => {
    const parsed = parseVideoUrl("https://vimeo.com/123456789");
    expect(parsed?.provider).toBe("vimeo");
    expect(parsed?.embedUrl).toBe("https://player.vimeo.com/video/123456789");
  });

  it("treats direct https video files as native-player sources", () => {
    expect(parseVideoUrl("https://cdn.example.com/clip.mp4")?.provider).toBe("file");
    expect(parseVideoUrl("https://example.com/page")?.provider).toBe("link");
  });

  it("rejects non-https input, garbage, and malformed ids", () => {
    expect(parseVideoUrl("http://youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseVideoUrl("not a url")).toBeNull();
    expect(parseVideoUrl("https://www.youtube.com/watch?v=!!!")).toBeNull();
    expect(parseVideoUrl("https://vimeo.com/abc")).toBeNull();
  });
});

describe("audio URL validation", () => {
  it("accepts https audio files and pages", () => {
    expect(parseAudioUrl("https://example.com/track.mp3")?.provider).toBe("file");
    expect(parseAudioUrl("https://example.com/listen")?.provider).toBe("link");
  });
  it("rejects invalid input", () => {
    expect(parseAudioUrl("")).toBeNull();
    expect(parseAudioUrl("not a url")).toBeNull();
  });
});

describe("coupon expiration", () => {
  it("detects expired and active dates (end-of-day boundary)", () => {
    const now = new Date(2026, 6, 16, 12, 0, 0); // 2026-07-16 noon
    expect(isCouponExpired("2026-07-15", now)).toBe(true);
    expect(isCouponExpired("2026-07-16", now)).toBe(false); // valid through today
    expect(isCouponExpired("2026-07-17", now)).toBe(false);
    expect(isCouponExpired("", now)).toBe(false);
  });

  it("formats discount labels", () => {
    expect(couponDiscountLabel({ discountType: "percent", discountValue: "20" })).toBe("20% off");
    expect(couponDiscountLabel({ discountType: "amount", discountValue: "$15" })).toBe("$15 off");
    expect(couponDiscountLabel({ discountType: "text", discountValue: "Buy 1 get 1" })).toBe("Buy 1 get 1");
  });
});

describe("public URL + slug", () => {
  it("builds /q/[slug] from the configured app URL", () => {
    expect(publicQrUrl("abc123defg")).toMatch(/^https?:\/\/.+\/q\/abc123defg$/);
  });

  it("generates crypto-random slugs of the right shape", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const slug = generateSlug();
      expect(slug).toHaveLength(SLUG_LENGTH);
      expect(isValidSlug(slug)).toBe(true);
      seen.add(slug);
    }
    expect(seen.size).toBe(200); // no collisions in a small sample
  });

  it("rejects malformed slugs", () => {
    expect(isValidSlug("UPPER")).toBe(false);
    expect(isValidSlug("with space")).toBe(false);
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("../../etc")).toBe(false);
  });
});

describe("upload validation", () => {
  it("rejects unsupported file types", () => {
    expect(
      checkUploadMetadata({ assetType: "pdf", fileName: "evil.exe", fileSize: 100, mimeType: "application/pdf" }).ok,
    ).toBe(false);
    expect(
      checkUploadMetadata({ assetType: "image", fileName: "x.png", mimeType: "text/html", fileSize: 100 }).ok,
    ).toBe(false);
  });

  it("rejects oversized files", () => {
    expect(
      checkUploadMetadata({
        assetType: "pdf",
        fileName: "big.pdf",
        mimeType: "application/pdf",
        fileSize: 16 * 1024 * 1024,
      }).ok,
    ).toBe(false);
  });

  it("accepts a valid PDF", () => {
    expect(
      checkUploadMetadata({ assetType: "pdf", fileName: "doc.pdf", mimeType: "application/pdf", fileSize: 1024 }).ok,
    ).toBe(true);
  });

  it("sniffs magic bytes and rejects mismatched contents", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 something longer here");
    expect(sniffMagicBytes(pdf)).toBe("pdf");
    expect(checkMagicBytes("pdf", pdf).ok).toBe(true);
    // HTML masquerading as a PDF:
    const html = new TextEncoder().encode("<html><body>hi</body></html>");
    expect(checkMagicBytes("pdf", html).ok).toBe(false);
    // PNG:
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffMagicBytes(png)).toBe("png");
    expect(checkMagicBytes("image", png).ok).toBe(true);
    expect(checkMagicBytes("audio", png).ok).toBe(false);
  });

  it("sanitizes file names (paths, unsafe chars, length)", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("my file (final)!.pdf")).toBe("my-file-final.pdf");
    expect(sanitizeFileName("x".repeat(200) + ".png").length).toBeLessThanOrEqual(70);
  });

  it("only accepts owned storage paths", () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const qrId = "22222222-2222-4222-8222-222222222222";
    const path = buildStoragePath(userId, qrId, "menu.pdf");
    expect(isOwnedStoragePath(path, userId, qrId)).toBe(true);
    expect(isOwnedStoragePath(path, "33333333-3333-4333-8333-333333333333", qrId)).toBe(false);
    expect(isOwnedStoragePath("../../secrets", userId, qrId)).toBe(false);
    expect(isOwnedStoragePath(`${userId}/${qrId}/../escape.pdf`, userId, qrId)).toBe(false);
  });
});
