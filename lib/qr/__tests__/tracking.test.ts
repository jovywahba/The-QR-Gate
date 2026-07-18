import { describe, expect, it } from "vitest";
import {
  canToggleTracking,
  encodesServerUrl,
  isTrackable,
  resolveTrackingMode,
  trackingCapability,
} from "../tracking";
import type { QRContent } from "../types";

const website: QRContent = { type: "website", data: { url: "https://example.com", title: "", description: "" } };
const wifi: QRContent = { type: "wifi", data: { ssid: "Net", password: "p", encryption: "WPA", hidden: false } };
const vcard: QRContent = {
  type: "vcard",
  data: {
    firstName: "A",
    lastName: "B",
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
const pdf = { type: "pdf", data: { title: "Doc", description: "", buttonLabel: "Open", file: null } } as unknown as QRContent;
const videoUrl = { type: "video", data: { mode: "url", videoUrl: "https://youtu.be/x", title: "" } } as unknown as QRContent;
const videoUpload = { type: "video", data: { mode: "upload", file: null, title: "" } } as unknown as QRContent;

describe("tracking capability", () => {
  it("hosted types are always hosted", () => {
    expect(trackingCapability(pdf)).toBe("hosted");
    expect(trackingCapability(videoUpload)).toBe("hosted");
  });
  it("direct URL types are optional", () => {
    expect(trackingCapability(website)).toBe("optional");
    expect(trackingCapability(videoUrl)).toBe("optional");
  });
  it("wifi + vcard cannot be tracked", () => {
    expect(trackingCapability(wifi)).toBe("none");
    expect(trackingCapability(vcard)).toBe("none");
  });
});

describe("resolveTrackingMode", () => {
  it("hosted → hosted regardless of toggle", () => {
    expect(resolveTrackingMode(pdf, false)).toBe("hosted");
    expect(resolveTrackingMode(pdf, true)).toBe("hosted");
  });
  it("native → native regardless of toggle", () => {
    expect(resolveTrackingMode(wifi, true)).toBe("native");
    expect(resolveTrackingMode(vcard, false)).toBe("native");
  });
  it("optional toggles between direct and redirect", () => {
    expect(resolveTrackingMode(website, false)).toBe("direct");
    expect(resolveTrackingMode(website, true)).toBe("redirect");
  });
});

describe("mode predicates", () => {
  it("hosted + redirect encode our URL (need a slug)", () => {
    expect(encodesServerUrl("hosted")).toBe(true);
    expect(encodesServerUrl("redirect")).toBe(true);
    expect(encodesServerUrl("direct")).toBe(false);
    expect(encodesServerUrl("native")).toBe(false);
  });
  it("hosted + redirect are trackable; direct + native are not", () => {
    expect(isTrackable("hosted")).toBe(true);
    expect(isTrackable("redirect")).toBe(true);
    expect(isTrackable("direct")).toBe(false);
    expect(isTrackable("native")).toBe(false);
  });
  it("only optional types can toggle tracking", () => {
    expect(canToggleTracking(website)).toBe(true);
    expect(canToggleTracking(pdf)).toBe(false);
    expect(canToggleTracking(wifi)).toBe(false);
  });
});
