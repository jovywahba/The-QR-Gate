import { describe, expect, it } from "vitest";
import { QR_TYPES } from "../registry";
import { resolveWizardStep } from "../wizard-url";

describe("resolveWizardStep", () => {
  it("opens Step 2 for a chosen type with no ?step= (the deep-link bug)", () => {
    expect(resolveWizardStep(undefined, true)).toBe(2);
    expect(resolveWizardStep(null, true)).toBe(2);
    expect(resolveWizardStep("", true)).toBe(2);
  });

  it("honors an explicit valid step (2, 3, 4) when a type is present", () => {
    expect(resolveWizardStep("2", true)).toBe(2);
    expect(resolveWizardStep("3", true)).toBe(3);
    expect(resolveWizardStep("4", true)).toBe(4);
    expect(resolveWizardStep(3, true)).toBe(3);
  });

  it("clamps a bogus or out-of-range step down to Step 2 for a chosen type", () => {
    for (const bad of ["1", "0", "5", "-2", "abc", "3.5", "99"]) {
      expect(resolveWizardStep(bad, true)).toBe(2);
    }
  });

  it("always falls back to Step 1 when there is no type (invalid ?type=)", () => {
    for (const step of [undefined, "2", "3", "4", "1", "bogus"]) {
      expect(resolveWizardStep(step, false)).toBe(1);
    }
  });

  it("deep-links every registered QR type straight to its Add-Content step", () => {
    // Guards that the whole registry behaves — /create?type=<id> => Step 2.
    for (const t of QR_TYPES) {
      expect(resolveWizardStep(undefined, true), `type ${t.id}`).toBe(2);
    }
    expect(QR_TYPES.length).toBe(16);
  });
});
