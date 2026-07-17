import { describe, expect, it } from "vitest";
import { demoFixtureFor } from "../demo-fixtures";
import { previewCapability, videoEmbed } from "../preview-capabilities";
import { appleAppId, isBlockedHost } from "../preview-ssrf";
import { QR_TYPES } from "../registry";
import type { QRContent } from "../types";

const ALL = QR_TYPES.map((t) => t.id);

describe("live-demo fixtures", () => {
  it("provides a fixture for all 16 types, matching the type", () => {
    for (const t of ALL) {
      const f = demoFixtureFor(t);
      expect(f.type, t).toBe(t);
      expect(f.data, t).toBeTruthy();
    }
  });

  it("image/file fixtures point at REAL local files under /demo-previews (not fabricated)", () => {
    const paths: string[] = [];
    for (const t of ALL) {
      JSON.stringify(demoFixtureFor(t), (k, v) => {
        if (k === "previewUrl" && typeof v === "string") paths.push(v);
        return v;
      });
    }
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(p.startsWith("/demo-previews/"), p).toBe(true);
    }
  });

  it("carries no fabricated third-party stats (followers/ratings/likes/views)", () => {
    const blob = JSON.stringify(ALL.map(demoFixtureFor)).toLowerCase();
    for (const banned of ["follower", "followers", "rating", "likes", " views", "posts"]) {
      expect(blob.includes(banned), `fixture text contains "${banned}"`).toBe(false);
    }
  });

  it("uses real public/official URLs where a URL is needed", () => {
    const yt = demoFixtureFor("video");
    if (yt.type === "video") expect(yt.data.videoUrl).toMatch(/youtube\.com|youtu\.be/);
    const apps = demoFixtureFor("apps");
    if (apps.type === "apps") expect(apps.data.appStoreUrl).toMatch(/apps\.apple\.com/);
  });
});

describe("preview capability selection", () => {
  it("classifies each type's default demo content sensibly", () => {
    expect(previewCapability(demoFixtureFor("website"))).toBe("sandboxed-iframe");
    expect(previewCapability(demoFixtureFor("pdf"))).toBe("native-player");
    expect(previewCapability(demoFixtureFor("video"))).toBe("official-embed"); // youtube url
    expect(previewCapability(demoFixtureFor("mp3"))).toBe("native-player"); // uploaded file
    expect(previewCapability(demoFixtureFor("images"))).toBe("structured-content");
    expect(previewCapability(demoFixtureFor("menu"))).toBe("native-player"); // pdf mode
    expect(previewCapability(demoFixtureFor("instagram"))).toBe("official-embed");
    expect(previewCapability(demoFixtureFor("facebook"))).toBe("official-embed");
    expect(previewCapability(demoFixtureFor("apps"))).toBe("metadata-card");
    expect(previewCapability(demoFixtureFor("links"))).toBe("structured-content");
    expect(previewCapability(demoFixtureFor("whatsapp"))).toBe("structured-content");
  });

  it("returns an honest empty capability for blank content", () => {
    const emptyWebsite: QRContent = { type: "website", data: { url: "", title: "", description: "" } };
    expect(previewCapability(emptyWebsite)).toBe("empty");
    const emptyPdf: QRContent = {
      type: "pdf",
      data: { title: "", description: "", buttonLabel: "Open PDF", file: null },
    };
    expect(previewCapability(emptyPdf)).toBe("empty");
  });

  it("resolves the official YouTube embed for the video demo", () => {
    const v = demoFixtureFor("video");
    if (v.type !== "video") throw new Error("unreachable");
    const embed = videoEmbed(v);
    expect(embed?.provider).toBe("youtube");
    expect(embed?.embedUrl).toContain("youtube-nocookie.com/embed/");
  });
});

describe("metadata fetch SSRF guard", () => {
  it("blocks loopback / private / link-local hosts", () => {
    for (const h of ["localhost", "127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.0.1", "169.254.169.254", "foo.internal", "::1", "metadata.google.internal"]) {
      expect(isBlockedHost(h), h).toBe(true);
    }
  });
  it("allows public hosts", () => {
    for (const h of ["example.com", "the-qr-gate.vercel.app", "youtube.com", "8.8.8.8"]) {
      expect(isBlockedHost(h), h).toBe(false);
    }
  });
  it("extracts Apple app ids", () => {
    expect(appleAppId("https://apps.apple.com/us/app/testflight/id899247664")).toBe("899247664");
    expect(appleAppId("https://play.google.com/store/apps/details?id=com.x")).toBeNull();
  });
});
