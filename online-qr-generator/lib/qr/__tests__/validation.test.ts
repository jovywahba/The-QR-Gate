import { describe, expect, it } from "vitest";
import { downloadQRCodePng, exportFileName } from "../download";
import { validateContent } from "../validation";

describe("content validation", () => {
  it("accepts a valid website and rejects an invalid one", () => {
    expect(validateContent({ type: "website", data: { url: "example.com" } }).valid).toBe(true);
    const bad = validateContent({ type: "website", data: { url: "not a url" } });
    expect(bad.valid).toBe(false);
    expect(bad.fieldErrors.url).toBeTruthy();
  });

  it("flags missing WhatsApp fields with per-field errors", () => {
    const result = validateContent({ type: "whatsapp", data: { countryCode: "", phone: "" } });
    expect(result.valid).toBe(false);
    expect(result.fieldErrors.countryCode).toBeTruthy();
    expect(result.fieldErrors.phone).toBeTruthy();
  });

  it("requires a WiFi password for WPA but not for open networks", () => {
    const wpa = validateContent({
      type: "wifi",
      data: { ssid: "Net", password: "", encryption: "WPA", hidden: false },
    });
    expect(wpa.valid).toBe(false);
    expect(wpa.fieldErrors.password).toBeTruthy();

    const short = validateContent({
      type: "wifi",
      data: { ssid: "Net", password: "1234", encryption: "WPA", hidden: false },
    });
    expect(short.valid).toBe(false);

    const open = validateContent({
      type: "wifi",
      data: { ssid: "Net", password: "", encryption: "nopass", hidden: false },
    });
    expect(open.valid).toBe(true);
  });

  it("requires at least a first or last name on vCards", () => {
    const empty = validateContent({ type: "vcard", data: { firstName: "", lastName: "" } });
    expect(empty.valid).toBe(false);
    expect(empty.fieldErrors.firstName).toBeTruthy();

    expect(validateContent({ type: "vcard", data: { firstName: "A", lastName: "" } }).valid).toBe(true);
  });

  it("validates optional vCard email/website only when present", () => {
    expect(
      validateContent({ type: "vcard", data: { firstName: "A", lastName: "", email: "nope" } }).valid,
    ).toBe(false);
    expect(
      validateContent({ type: "vcard", data: { firstName: "A", lastName: "", email: "a@b.co" } }).valid,
    ).toBe(true);
  });
});

describe("download gating", () => {
  it("an empty/invalid payload blocks the PNG download", async () => {
    const { defaultDesign } = await import("../defaults");
    await expect(
      downloadQRCodePng({ payload: "", type: "website", design: defaultDesign }),
    ).resolves.toBe(false);
  });

  it("names files the-qr-gate-{type}-{date}.{format}", () => {
    expect(exportFileName("website", "png", new Date(2026, 6, 16))).toBe("the-qr-gate-website-2026-07-16.png");
    expect(exportFileName("wifi", "png", new Date(2026, 0, 3))).toBe("the-qr-gate-wifi-2026-01-03.png");
    expect(exportFileName("business", "svg", new Date(2026, 6, 16))).toBe("the-qr-gate-business-2026-07-16.svg");
  });
});
