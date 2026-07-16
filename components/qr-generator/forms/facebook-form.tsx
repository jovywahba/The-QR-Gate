"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeFacebookUrl } from "@/lib/qr/payloads";
import { useQRWizard } from "../use-qr-wizard";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = ["url", "pageName", "description"] as const;

/** Direct QR — encodes the normalized page URL, no publishing needed. */
export function FacebookForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "facebook");

  if (state.content?.type !== "facebook") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "facebook", data: { ...data, ...patch } });

  const urlError = showError("url", validation.fieldErrors);
  const normalized = normalizeFacebookUrl(data.url);

  return (
    <div className="space-y-5">
      <Field
        id={fieldId("facebook", "url")}
        label="Facebook page URL"
        required
        error={urlError}
        hint={
          normalized && normalized !== data.url.trim() ? (
            <>Encodes <span className="font-mono break-all">{normalized}</span></>
          ) : (
            "e.g. facebook.com/yourpage — or just the page name."
          )
        }
      >
        <Input
          {...fieldAria(fieldId("facebook", "url"), urlError, true)}
          type="text"
          inputMode="url"
          placeholder="facebook.com/yourpage"
          value={data.url}
          onChange={(e) => set({ url: e.target.value })}
          onBlur={() => touch("url")}
        />
      </Field>

      <Field
        id={fieldId("facebook", "pageName")}
        label="Page name"
        error={showError("pageName", validation.fieldErrors)}
        hint="Only used to label the preview — not encoded in the code."
      >
        <Input
          {...fieldAria(fieldId("facebook", "pageName"), showError("pageName", validation.fieldErrors), true)}
          type="text"
          placeholder="Your Page"
          value={data.pageName}
          onChange={(e) => set({ pageName: e.target.value })}
          onBlur={() => touch("pageName")}
        />
      </Field>

      <Field
        id={fieldId("facebook", "description")}
        label="Description"
        error={showError("description", validation.fieldErrors)}
      >
        <Textarea
          {...fieldAria(fieldId("facebook", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="What will people find on this page?"
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>
    </div>
  );
}
