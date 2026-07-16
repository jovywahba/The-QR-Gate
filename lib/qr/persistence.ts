import { initialWizardState, migrateDesign } from "./defaults";
import { isQRType } from "./registry";
import type { QRContent, QRWizardState, WizardStep } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * Safe draft persistence — sessionStorage only, so a refresh keeps
 * the user's work but closing the tab clears it.
 *
 * SECURITY: the WiFi password lives ONLY in memory. `toSafeDraft`
 * redacts it AND the generated WIFI: payload (which embeds it)
 * before anything is written. Never widen this.
 * ───────────────────────────────────────────────────────────────
 */

export const DRAFT_STORAGE_KEY = "the-qr-gate:draft:v1";
/** Pre-rebrand key — read once and migrated, never written again. */
const LEGACY_DRAFT_KEY = "qraft:draft:v1";

/** ~600 KB of base64 ≈ 450 KB image — plenty for a logo, safe for sessionStorage. */
export const MAX_PERSISTED_LOGO_CHARS = 600_000;

export type SafeDraft = {
  version: 1;
  step: WizardStep;
  selectedType: QRWizardState["selectedType"];
  content: QRContent | null;
  design: QRWizardState["design"];
  generatedPayload: string;
  qrCodeId?: string;
  publicUrl?: string;
  slug?: string;
  publishingStatus?: "idle" | "published";
};

/** Keys that must never leave memory (transient signed URLs, blobs). */
const TRANSIENT_KEYS = new Set(["previewUrl"]);

/** Deep-clone via JSON while dropping transient keys (signed URLs etc.). */
function stripTransient<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, v) => (TRANSIENT_KEYS.has(key) ? undefined : v)),
  ) as T;
}

/** Strip anything sensitive before the draft leaves memory. */
export function toSafeDraft(state: QRWizardState): SafeDraft {
  let content = state.content;
  let generatedPayload = state.generatedPayload;

  if (content?.type === "wifi") {
    content = { type: "wifi", data: { ...content.data, password: "" } };
    // The WIFI: payload contains the password — never persist it either.
    generatedPayload = "";
  }

  // Logos persist as data URLs only up to a sane sessionStorage budget;
  // past it we keep the file name so the UI can ask for a reselect.
  let design = state.design;
  if (design.logoDataUrl && design.logoDataUrl.length > MAX_PERSISTED_LOGO_CHARS) {
    design = { ...design, logoDataUrl: null };
  }

  return {
    version: 1,
    step: state.step,
    selectedType: state.selectedType,
    // Signed preview URLs are transient — uploaded-asset references
    // (assetId/fileName/size/mime) are safe and survive refresh.
    content: content ? stripTransient(content) : null,
    design,
    generatedPayload,
    qrCodeId: state.qrCodeId,
    publicUrl: state.publicUrl,
    slug: state.slug,
    publishingStatus: state.publishingStatus === "published" ? "published" : "idle",
  };
}

export function saveDraft(state: QRWizardState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toSafeDraft(state)));
  } catch {
    // Storage full/blocked — drafts are a convenience, never fatal.
  }
}

/**
 * One-time migration: drafts saved under the old "qraft" key are moved
 * to the new key so nothing in progress disappears across the rebrand.
 */
function migrateLegacyDraft(): string | null {
  try {
    const legacy = window.sessionStorage.getItem(LEGACY_DRAFT_KEY);
    if (!legacy) return null;
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, legacy);
    window.sessionStorage.removeItem(LEGACY_DRAFT_KEY);
    return legacy;
  } catch {
    return null;
  }
}

/** Restore a draft into a fresh wizard state. Returns null when absent/invalid. */
export function loadDraft(): QRWizardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? migrateLegacyDraft();
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<SafeDraft>;
    if (draft.version !== 1) return null;

    const step: WizardStep = draft.step === 2 || draft.step === 3 || draft.step === 4 ? draft.step : 1;
    const selectedType = isQRType(draft.selectedType ?? null) ? draft.selectedType! : null;

    return {
      ...initialWizardState(),
      step: selectedType ? step : 1,
      selectedType,
      content: draft.content && typeof draft.content === "object" ? draft.content : null,
      design: migrateDesign(draft.design),
      generatedPayload: typeof draft.generatedPayload === "string" ? draft.generatedPayload : "",
      qrCodeId: typeof draft.qrCodeId === "string" ? draft.qrCodeId : undefined,
      publicUrl: typeof draft.publicUrl === "string" ? draft.publicUrl : undefined,
      slug: typeof draft.slug === "string" ? draft.slug : undefined,
      publishingStatus: draft.publishingStatus === "published" ? "published" : "idle",
    };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // ignore
  }
}
