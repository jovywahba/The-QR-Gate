import { describe, expect, it } from "vitest";
import { getQRType, isQRType, QR_TYPES } from "../registry";

const EXPECTED_IDS = [
  "website",
  "pdf",
  "links",
  "vcard",
  "business",
  "video",
  "images",
  "facebook",
  "instagram",
  "social",
  "whatsapp",
  "mp3",
  "menu",
  "apps",
  "coupon",
  "wifi",
] as const;

describe("QR type registry", () => {
  it("contains all 16 QR types", () => {
    expect(QR_TYPES).toHaveLength(16);
    for (const id of EXPECTED_IDS) {
      expect(QR_TYPES.some((t) => t.id === id)).toBe(true);
    }
  });

  it("has unique ids", () => {
    const ids = QR_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has a name, description, category, and icon", () => {
    for (const t of QR_TYPES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(["direct", "hosted"]).toContain(t.category);
      expect(t.icon).toBeTruthy();
    }
  });

  it("the four Part-1 types are implemented with default content", () => {
    for (const id of ["website", "whatsapp", "wifi", "vcard"] as const) {
      const def = getQRType(id);
      expect(def.implemented).toBe(true);
      expect(def.defaultContent).not.toBeNull();
    }
  });

  it("isQRType guards unknown values", () => {
    expect(isQRType("website")).toBe(true);
    expect(isQRType("bitcoin")).toBe(false);
    expect(isQRType(null)).toBe(false);
    expect(isQRType("")).toBe(false);
  });
});
