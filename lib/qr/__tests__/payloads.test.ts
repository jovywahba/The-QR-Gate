import { describe, expect, it } from "vitest";
import {
  buildPayload,
  buildVCardPayload,
  buildWebsitePayload,
  buildWhatsAppPayload,
  buildWifiPayload,
  cleanWhatsAppPhone,
  escapeVCardValue,
  escapeWifiValue,
  normalizeUrl,
} from "../payloads";
import type { VCardContent, WiFiContent } from "../types";

describe("normalizeUrl (Website)", () => {
  it("prepends https:// to bare domains", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("keeps explicit http:// and https://", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
    expect(normalizeUrl("https://example.com/path?q=1")).toBe("https://example.com/path?q=1");
  });

  it("trims whitespace around the input", () => {
    expect(normalizeUrl("  example.com  ")).toBe("https://example.com/");
  });

  it("allows localhost and IPs", () => {
    expect(normalizeUrl("localhost:3000")).toBe("https://localhost:3000/");
    expect(normalizeUrl("192.168.1.1")).toBe("https://192.168.1.1/");
  });

  it("rejects invalid URLs", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
    expect(normalizeUrl("just-text")).toBeNull();
    expect(normalizeUrl("ftp://example.com")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("http://")).toBeNull();
  });

  it("website payload is the normalized URL", () => {
    expect(buildWebsitePayload({ url: "example.com" })).toBe("https://example.com/");
    expect(buildWebsitePayload({ url: "nope nope" })).toBe("");
  });
});

describe("WhatsApp", () => {
  it("strips spaces, plus signs, brackets, and hyphens", () => {
    expect(cleanWhatsAppPhone("+20", "100 123 4567")).toBe("201001234567");
    expect(cleanWhatsAppPhone("(+49)", "151-234-5678")).toBe("491512345678");
  });

  it("returns empty when non-phone characters remain", () => {
    expect(cleanWhatsAppPhone("+20", "abc")).toBe("");
  });

  it("builds the wa.me link from the prompt example", () => {
    expect(
      buildWhatsAppPayload({ countryCode: "+20", phone: "100 123 4567", message: "Hello" }),
    ).toBe("https://wa.me/201001234567?text=Hello");
  });

  it("URL-encodes the message", () => {
    expect(
      buildWhatsAppPayload({ countryCode: "+1", phone: "5551234567", message: "Hi there & welcome!" }),
    ).toBe("https://wa.me/15551234567?text=Hi%20there%20%26%20welcome!");
  });

  it("omits ?text when there is no message", () => {
    expect(buildWhatsAppPayload({ countryCode: "+1", phone: "5551234567" })).toBe(
      "https://wa.me/15551234567",
    );
  });

  it("rejects numbers outside 6–15 digits", () => {
    expect(buildWhatsAppPayload({ countryCode: "+1", phone: "23" })).toBe("");
    expect(buildWhatsAppPayload({ countryCode: "+1", phone: "234567890123456789" })).toBe("");
  });
});

describe("WiFi", () => {
  const base: WiFiContent = { ssid: "Office WiFi", password: "password123", encryption: "WPA", hidden: false };

  it("builds the prompt example payload", () => {
    expect(buildWifiPayload(base)).toBe("WIFI:T:WPA;S:Office WiFi;P:password123;H:false;;");
  });

  it("escapes backslashes, semicolons, commas, colons, and quotes", () => {
    expect(escapeWifiValue('a\\b;c,d:e"f')).toBe('a\\\\b\\;c\\,d\\:e\\"f');
    expect(
      buildWifiPayload({ ...base, ssid: "Cafe;Net", password: 'p:a,s"s\\1234' }),
    ).toBe('WIFI:T:WPA;S:Cafe\\;Net;P:p\\:a\\,s\\"s\\\\1234;H:false;;');
  });

  it("escapes backslash before other characters (no double escaping)", () => {
    expect(escapeWifiValue(";")).toBe("\\;");
    expect(escapeWifiValue("\\;")).toBe("\\\\\\;");
  });

  it("handles open networks without a password field", () => {
    expect(buildWifiPayload({ ...base, encryption: "nopass", password: "" })).toBe(
      "WIFI:T:nopass;S:Office WiFi;H:false;;",
    );
  });

  it("marks hidden networks", () => {
    expect(buildWifiPayload({ ...base, hidden: true })).toBe(
      "WIFI:T:WPA;S:Office WiFi;P:password123;H:true;;",
    );
  });

  it("requires SSID, and a password unless open", () => {
    expect(buildWifiPayload({ ...base, ssid: "  " })).toBe("");
    expect(buildWifiPayload({ ...base, password: "" })).toBe("");
  });
});

describe("vCard", () => {
  const base: VCardContent = {
    firstName: "First Name",
    lastName: "Last Name",
    company: "Company",
    jobTitle: "Job Title",
    mobile: "+201000000000",
    email: "user@example.com",
    website: "https://example.com",
    street: "Street",
    city: "City",
    country: "Country",
    note: "Optional note",
  };

  it("builds a valid vCard 3.0 with the prompt's fields", () => {
    const lines = buildVCardPayload(base).split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCARD");
    expect(lines[1]).toBe("VERSION:3.0");
    expect(lines).toContain("N:Last Name;First Name;;;");
    expect(lines).toContain("FN:First Name Last Name");
    expect(lines).toContain("ORG:Company");
    expect(lines).toContain("TITLE:Job Title");
    expect(lines).toContain("TEL;TYPE=CELL:+201000000000");
    expect(lines).toContain("EMAIL:user@example.com");
    expect(lines).toContain("URL:https://example.com/");
    expect(lines).toContain("ADR;TYPE=WORK:;;Street;City;;;Country");
    expect(lines).toContain("NOTE:Optional note");
    expect(lines[lines.length - 1]).toBe("END:VCARD");
  });

  it("escapes commas, semicolons, backslashes, and line breaks", () => {
    expect(escapeVCardValue("a,b;c\\d")).toBe("a\\,b\\;c\\\\d");
    expect(escapeVCardValue("line1\nline2\r\nline3")).toBe("line1\\nline2\\nline3");
    const payload = buildVCardPayload({ firstName: "Ann;e", lastName: "O,Neil", note: "a\nb" });
    expect(payload).toContain("N:O\\,Neil;Ann\\;e;;;");
    expect(payload).toContain("NOTE:a\\nb");
  });

  it("omits empty optional lines", () => {
    const payload = buildVCardPayload({ firstName: "Solo", lastName: "" });
    expect(payload).not.toContain("ORG:");
    expect(payload).not.toContain("TEL");
    expect(payload).not.toContain("ADR");
    expect(payload).not.toContain("NOTE:");
  });

  it("requires at least a first or last name", () => {
    expect(buildVCardPayload({ firstName: "", lastName: "" })).toBe("");
  });
});

describe("buildPayload dispatcher", () => {
  it("routes each content type to its builder", () => {
    expect(buildPayload({ type: "website", data: { url: "example.com" } })).toBe("https://example.com/");
    expect(buildPayload({ type: "whatsapp", data: { countryCode: "+1", phone: "5551234567" } })).toBe(
      "https://wa.me/15551234567",
    );
    expect(
      buildPayload({ type: "wifi", data: { ssid: "Net", password: "12345678", encryption: "WPA", hidden: false } }),
    ).toBe("WIFI:T:WPA;S:Net;P:12345678;H:false;;");
    expect(buildPayload({ type: "vcard", data: { firstName: "A", lastName: "B" } })).toContain("BEGIN:VCARD");
  });
});
