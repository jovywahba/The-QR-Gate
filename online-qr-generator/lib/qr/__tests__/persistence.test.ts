import { afterEach, describe, expect, it, vi } from "vitest";
import { initialWizardState } from "../defaults";
import { buildPayload } from "../payloads";
import { DRAFT_STORAGE_KEY, loadDraft, toSafeDraft } from "../persistence";
import type { QRWizardState } from "../types";

function wifiState(): QRWizardState {
  const content = {
    type: "wifi",
    data: { ssid: "Office WiFi", password: "super-secret-1", encryption: "WPA", hidden: false },
  } as const;
  return {
    ...initialWizardState(),
    step: 2,
    selectedType: "wifi",
    content,
    generatedPayload: buildPayload(content),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("safe draft persistence", () => {
  it("excludes the WiFi password from the persisted safe state", () => {
    const state = wifiState();
    expect(state.generatedPayload).toContain("super-secret-1"); // sanity: it IS in memory

    const draft = toSafeDraft(state);
    expect(JSON.stringify(draft)).not.toContain("super-secret-1");
    expect(draft.content?.type).toBe("wifi");
    if (draft.content?.type === "wifi") {
      expect(draft.content.data.password).toBe("");
      expect(draft.content.data.ssid).toBe("Office WiFi"); // safe fields survive
    }
  });

  it("also redacts the generated WIFI: payload (it embeds the password)", () => {
    const draft = toSafeDraft(wifiState());
    expect(draft.generatedPayload).toBe("");
  });

  it("migrates old qraft:draft:v1 drafts to the-qr-gate:draft:v1 without losing them", () => {
    const store = new Map<string, string>();
    const sessionStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    vi.stubGlobal("window", { sessionStorage });

    const legacyDraft = JSON.stringify({
      version: 1,
      step: 2,
      selectedType: "website",
      content: { type: "website", data: { url: "example.com" } },
      design: {},
      generatedPayload: "https://example.com/",
    });
    store.set("qraft:draft:v1", legacyDraft);

    const restored = loadDraft();
    expect(restored?.selectedType).toBe("website"); // draft survived the rebrand
    expect(store.get(DRAFT_STORAGE_KEY)).toBe(legacyDraft); // moved to the new key
    expect(store.has("qraft:draft:v1")).toBe(false); // old key cleaned up
    expect(DRAFT_STORAGE_KEY).toBe("the-qr-gate:draft:v1");
  });

  it("keeps non-sensitive payloads for other types", () => {
    const content = { type: "website", data: { url: "example.com" } } as const;
    const state: QRWizardState = {
      ...initialWizardState(),
      step: 2,
      selectedType: "website",
      content,
      generatedPayload: buildPayload(content),
    };
    const draft = toSafeDraft(state);
    expect(draft.generatedPayload).toBe("https://example.com/");
    expect(draft.step).toBe(2);
    expect(draft.selectedType).toBe("website");
  });
});
