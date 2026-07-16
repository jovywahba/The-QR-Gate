"use client";

import * as React from "react";
import { publicSupabaseConfig } from "@/lib/qr/config";
import { defaultContentFor, defaultDesign, initialWizardState, migrateDesign } from "@/lib/qr/defaults";
import { buildPayload, requiresPublishing } from "@/lib/qr/payloads";
import { clearDraft, loadDraft, saveDraft } from "@/lib/qr/persistence";
import { evaluateDesign, type QRReadabilityResult } from "@/lib/qr/readability";
import { getQRType, isQRType } from "@/lib/qr/registry";
import type { QRContent, QRDesignOptions, QRType, QRWizardState, WizardStep } from "@/lib/qr/types";
import { publishQR, UploadError } from "@/lib/qr/uploads-client";
import { validateContent, type ContentValidation } from "@/lib/qr/validation";
import { createClient } from "@/lib/supabase/client";

/**
 * ───────────────────────────────────────────────────────────────
 * Wizard state for the 4-step builder.
 *
 * URL is the source of truth for `step` + `selectedType`
 * (`/create?type=website&step=2`); sessionStorage holds the safe
 * draft (content + design — WiFi passwords never persist). Steps
 * navigate with history.pushState so Back/Forward work and nothing
 * remounts (content survives).
 * ───────────────────────────────────────────────────────────────
 */

const NO_VALIDATION: ContentValidation = { valid: false, fieldErrors: {} };

type WizardContextValue = {
  state: QRWizardState;
  /** Zod result for the current content ({} errors when nothing to validate). */
  validation: ContentValidation;
  /** True once the sessionStorage draft has been applied (client-only). */
  hydrated: boolean;
  /** Bumps every time Continue is pressed with invalid content — forms react. */
  submitAttempt: number;
  selectType: (type: QRType) => void;
  goToStep: (step: WizardStep) => void;
  continueFrom: (step: WizardStep) => void;
  updateContent: (content: QRContent) => void;
  updateDesign: (design: QRDesignOptions) => void;
  /** Patch a few design fields without spelling out the whole object. */
  patchDesign: (patch: Partial<QRDesignOptions>) => void;
  /** Reset ONLY the design (content, type, publish state untouched). */
  resetDesign: () => void;
  /** Readability heuristics for the current design (errors gate Step 4 + download). */
  readability: QRReadabilityResult;
  startOver: () => void;
  /** Anything worth confirming before Start Over discards it? */
  isDirty: boolean;

  /* ── Publishing (hosted types) ── */
  /** Does the CURRENT content need a published /q/[slug] page? */
  needsPublishing: boolean;
  /** Signed-in user (null when signed out or Supabase unconfigured). */
  user: { id: string; email?: string } | null;
  /** False until the auth check settles (avoids sign-in flash). */
  authReady: boolean;
  /** Supabase publishing configuration (client-visible part). */
  publishingConfig: { configured: boolean; missing: string[] };
  publishError: string | null;
  /** Publish (or republish) the current hosted content. */
  publish: () => Promise<void>;
  /** Save the draft and go sign in, returning to the current step. */
  signInToPublish: () => void;
  /** First upload creates the server-side draft row — remember it. */
  registerQrCodeId: (qrCodeId: string) => void;
};

const WizardContext = React.createContext<WizardContextValue | null>(null);

export function useQRWizard(): WizardContextValue {
  const ctx = React.useContext(WizardContext);
  if (!ctx) throw new Error("useQRWizard must be used inside <QRWizardProvider>");
  return ctx;
}

/**
 * The exact string the QR encodes. Direct types build it locally;
 * hosted types ONLY ever encode the published /q/[slug] URL — never a
 * localhost object URL, never an unpublished guess.
 */
function derivePayload(state: Pick<QRWizardState, "content" | "publishingStatus" | "publicUrl">): string {
  const { content } = state;
  if (!content) return "";
  if (!validateContent(content).valid) return "";
  if (requiresPublishing(content)) {
    return state.publishingStatus === "published" && state.publicUrl ? state.publicUrl : "";
  }
  return buildPayload(content);
}

function urlFor(state: Pick<QRWizardState, "step" | "selectedType">): string {
  if (!state.selectedType) return "/";
  return `/create?type=${state.selectedType}&step=${state.step}`;
}

/** Clamp a step for a type: unimplemented types can't pass Step 2. */
function clampStep(step: WizardStep, type: QRType | null): WizardStep {
  if (!type) return 1;
  if (!getQRType(type).implemented && step > 2) return 2;
  return step;
}

/** A saved qr_codes row (ownership already verified server-side). */
export type WizardInitialRecord = {
  qrCodeId: string;
  content: QRContent | null;
  design: unknown;
  slug: string | null;
  publicUrl: string | null;
  published: boolean;
};

export function QRWizardProvider({
  children,
  initialType = null,
  initialStep = 1,
  initialRecord,
}: {
  children: React.ReactNode;
  initialType?: QRType | null;
  initialStep?: WizardStep;
  initialRecord?: WizardInitialRecord;
}) {
  const [state, setState] = React.useState<QRWizardState>(() => {
    const type = initialType && isQRType(initialType) ? initialType : null;
    if (initialRecord && type) {
      // Editing a saved QR: the record is the source of truth (the
      // sessionStorage draft is ignored and overwritten from here on).
      return {
        ...initialWizardState(),
        selectedType: type,
        step: clampStep(initialStep, type),
        content: initialRecord.content ?? defaultContentFor(type),
        design: migrateDesign(initialRecord.design),
        qrCodeId: initialRecord.qrCodeId,
        slug: initialRecord.slug ?? undefined,
        publicUrl: initialRecord.publicUrl ?? undefined,
        publishingStatus: initialRecord.published ? "published" : "idle",
      };
    }
    return {
      ...initialWizardState(),
      selectedType: type,
      step: type ? clampStep(initialStep, type) : 1,
      content: type ? defaultContentFor(type) : null,
    };
  });
  const [hydrated, setHydrated] = React.useState(false);
  const [submitAttempt, setSubmitAttempt] = React.useState(0);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<{ id: string; email?: string } | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const publishingConfig = React.useMemo(() => publicSupabaseConfig(), []);

  /* Track the signed-in user (skipped entirely when Supabase isn't configured). */
  React.useEffect(() => {
    if (!publishingConfig.configured) {
      setAuthReady(true);
      return;
    }
    const supabase = createClient();
    let cancelled = false;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) {
          setUser(data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [publishingConfig.configured]);

  /* Hydrate content/design from the safe draft. URL wins for step + type.
     Skipped entirely when editing a saved record (the DB row wins). */
  React.useEffect(() => {
    if (initialRecord) {
      setHydrated(true);
      return;
    }
    const draft = loadDraft();
    if (draft) {
      setState((prev) => {
        const sameType = draft.selectedType && draft.selectedType === prev.selectedType;
        const content = sameType
          ? (draft.content ?? prev.content)
          : prev.selectedType
            ? prev.content
            : draft.content;
        const selectedType = prev.selectedType ?? draft.selectedType;
        // Publish state only survives when it belongs to this draft's content.
        const keepPublish = !prev.selectedType || sameType;
        return {
          ...prev,
          selectedType,
          // On "/" stay on Step 1; on /create the URL already set step.
          content: content && content.type === selectedType ? content : selectedType ? defaultContentFor(selectedType) : null,
          design: draft.design,
          generatedPayload: "",
          qrCodeId: keepPublish ? draft.qrCodeId : undefined,
          publicUrl: keepPublish ? draft.publicUrl : undefined,
          slug: keepPublish ? draft.slug : undefined,
          publishingStatus: keepPublish ? draft.publishingStatus : "idle",
        };
      });
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydration
  }, []);

  /* Re-derive the payload whenever content/publish state changes. */
  const generatedPayload = React.useMemo(
    () => derivePayload(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.content, state.publishingStatus, state.publicUrl],
  );
  const fullState = React.useMemo<QRWizardState>(
    () => ({ ...state, generatedPayload }),
    [state, generatedPayload],
  );

  /* Persist the safe draft on every change (post-hydration only). */
  React.useEffect(() => {
    if (hydrated) saveDraft(fullState);
  }, [fullState, hydrated]);

  /* Back/Forward: read step + type back off the URL. */
  React.useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const rawType = params.get("type");
      const type = isQRType(rawType) ? rawType : null;
      const rawStep = Number(params.get("step"));
      const step: WizardStep =
        rawStep === 2 || rawStep === 3 || rawStep === 4 ? (rawStep as WizardStep) : 1;
      setState((prev) => ({
        ...prev,
        selectedType: type ?? prev.selectedType,
        step: clampStep(type ? step : 1, type ?? prev.selectedType),
        content:
          type && type !== prev.content?.type
            ? defaultContentFor(type)
            : prev.content,
      }));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = React.useCallback(
    (next: QRWizardState, push: boolean) => {
      setState(next);
      const url = urlFor(next);
      const current = window.location.pathname + window.location.search;
      if (url !== current) {
        if (push) window.history.pushState(null, "", url);
        else window.history.replaceState(null, "", url);
      }
    },
    [],
  );

  const selectType = React.useCallback(
    (type: QRType) => {
      setState((prev) => {
        const keepContent = prev.content?.type === type ? prev.content : defaultContentFor(type);
        const next: QRWizardState = {
          ...prev,
          selectedType: type,
          content: keepContent,
          step: 2,
          generatedPayload: "",
          publishingStatus: "idle",
        };
        window.history.pushState(null, "", urlFor(next));
        return next;
      });
    },
    [],
  );

  const goToStep = React.useCallback((step: WizardStep) => {
    setState((prev) => {
      const clamped = clampStep(step, prev.selectedType);
      if (clamped === prev.step) return prev;
      const next = { ...prev, step: clamped };
      window.history.pushState(null, "", urlFor(next));
      return next;
    });
  }, []);

  const validation = React.useMemo(
    () => (fullState.content ? validateContent(fullState.content) : NO_VALIDATION),
    [fullState.content],
  );

  const readability = React.useMemo(
    () => evaluateDesign(fullState.design, { hasPayload: fullState.generatedPayload.length > 0 }),
    [fullState.design, fullState.generatedPayload],
  );

  /**
   * Continue from `step`. Step 2 blocks until the content validates;
   * Step 3 blocks on readability ERRORS (warnings pass through).
   */
  const continueFrom = React.useCallback(
    (step: WizardStep) => {
      if (step === 4) return;
      if (step === 2 && !validation.valid) {
        setSubmitAttempt((n) => n + 1);
        return;
      }
      if (step === 3 && !readability.isSafe) {
        document.getElementById("qr-readability")?.scrollIntoView({ block: "center" });
        document.getElementById("qr-readability")?.focus();
        return;
      }
      goToStep((step + 1) as WizardStep);
    },
    [goToStep, validation.valid, readability.isSafe],
  );

  const updateContent = React.useCallback((content: QRContent) => {
    setState((prev) => ({
      ...prev,
      content,
      // Edits after a publish need a republish (same slug — no new URL)
      // before the QR/download claim they're live again.
      publishingStatus: prev.publishingStatus === "published" ? "idle" : prev.publishingStatus,
    }));
    setPublishError(null);
  }, []);

  const registerQrCodeId = React.useCallback((qrCodeId: string) => {
    setState((prev) => (prev.qrCodeId === qrCodeId ? prev : { ...prev, qrCodeId }));
  }, []);

  const needsPublishing = React.useMemo(
    () => (fullState.content ? requiresPublishing(fullState.content) : false),
    [fullState.content],
  );

  const signInToPublish = React.useCallback(() => {
    // Flush the draft synchronously, then leave — sessionStorage brings
    // the user back to this exact type + step after signing in.
    saveDraft(fullState);
    const returnTo = urlFor(fullState);
    window.location.assign(`/sign-in?redirect=${encodeURIComponent(returnTo)}`);
  }, [fullState]);

  const publish = React.useCallback(async () => {
    const content = fullState.content;
    if (!content || fullState.publishingStatus === "saving") return;
    if (!validateContent(content).valid) {
      setSubmitAttempt((n) => n + 1);
      return;
    }
    if (!requiresPublishing(content)) return;
    if (!publishingConfig.configured) {
      setPublishError(
        `Publishing isn't configured — missing ${publishingConfig.missing.join(", ")}.`,
      );
      return;
    }
    if (!user) {
      signInToPublish();
      return;
    }

    setState((prev) => ({ ...prev, publishingStatus: "saving" }));
    setPublishError(null);
    try {
      const result = await publishQR({
        qrCodeId: fullState.qrCodeId,
        type: content.type,
        content,
        design: fullState.design,
      });
      setState((prev) => ({
        ...prev,
        qrCodeId: result.qrCodeId,
        slug: result.slug,
        publicUrl: result.publicUrl,
        publishingStatus: "published",
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, publishingStatus: "error" }));
      if (error instanceof UploadError && error.status === 401) {
        signInToPublish();
        return;
      }
      setPublishError(
        error instanceof UploadError
          ? error.missing
            ? `${error.message} Missing: ${error.missing.join(", ")}.`
            : error.message
          : "Publishing failed. Please try again.",
      );
    }
  }, [fullState, publishingConfig, signInToPublish, user]);

  const updateDesign = React.useCallback((design: QRDesignOptions) => {
    setState((prev) => ({ ...prev, design }));
  }, []);

  const patchDesign = React.useCallback((patch: Partial<QRDesignOptions>) => {
    setState((prev) => ({ ...prev, design: { ...prev.design, ...patch } }));
  }, []);

  /** Design only — content, type, payload, and publish state stay put. */
  const resetDesign = React.useCallback(() => {
    setState((prev) => ({ ...prev, design: { ...defaultDesign } }));
  }, []);

  const isDirty = React.useMemo(() => {
    if (!fullState.selectedType) return false;
    if (!fullState.content) return false;
    return (
      JSON.stringify(fullState.content) !==
      JSON.stringify(defaultContentFor(fullState.selectedType))
    );
  }, [fullState.content, fullState.selectedType]);

  const startOver = React.useCallback(() => {
    clearDraft();
    const next = { ...initialWizardState(), design: defaultDesign };
    navigate(next, true);
    setSubmitAttempt(0);
    setPublishError(null);
  }, [navigate]);

  const value = React.useMemo<WizardContextValue>(
    () => ({
      state: fullState,
      validation,
      hydrated,
      submitAttempt,
      selectType,
      goToStep,
      continueFrom,
      updateContent,
      updateDesign,
      patchDesign,
      resetDesign,
      readability,
      startOver,
      isDirty,
      needsPublishing,
      user,
      authReady,
      publishingConfig,
      publishError,
      publish,
      signInToPublish,
      registerQrCodeId,
    }),
    [
      fullState,
      validation,
      hydrated,
      submitAttempt,
      selectType,
      goToStep,
      continueFrom,
      updateContent,
      updateDesign,
      patchDesign,
      resetDesign,
      readability,
      startOver,
      isDirty,
      needsPublishing,
      user,
      authReady,
      publishingConfig,
      publishError,
      publish,
      signInToPublish,
      registerQrCodeId,
    ],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
