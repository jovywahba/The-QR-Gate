"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeInstagramInput } from "@/lib/qr/payloads";
import { useQRWizard } from "../use-qr-wizard";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = ["handle", "title", "description"] as const;

/** Direct QR — encodes the normalized profile URL, no publishing needed. */
export function InstagramForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "instagram");

  if (state.content?.type !== "instagram") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "instagram", data: { ...data, ...patch } });

  const handleError = showError("handle", validation.fieldErrors);
  const normalized = normalizeInstagramInput(data.handle);

  return (
    <div className="space-y-5">
      <Field
        id={fieldId("instagram", "handle")}
        label="Instagram username or profile URL"
        required
        error={handleError}
        hint={
          normalized ? (
            <>Encodes <span className="font-mono break-all">{normalized}</span></>
          ) : (
            "e.g. @example, example, or instagram.com/example"
          )
        }
      >
        <Input
          {...fieldAria(fieldId("instagram", "handle"), handleError, true)}
          type="text"
          placeholder="@example"
          autoCapitalize="none"
          autoCorrect="off"
          value={data.handle}
          onChange={(e) => set({ handle: e.target.value })}
          onBlur={() => touch("handle")}
        />
      </Field>

      <Field
        id={fieldId("instagram", "title")}
        label="Title"
        error={showError("title", validation.fieldErrors)}
        hint="Only used to label the preview — not encoded in the code."
      >
        <Input
          {...fieldAria(fieldId("instagram", "title"), showError("title", validation.fieldErrors), true)}
          type="text"
          placeholder="My profile"
          value={data.title}
          onChange={(e) => set({ title: e.target.value })}
          onBlur={() => touch("title")}
        />
      </Field>

      <Field
        id={fieldId("instagram", "description")}
        label="Description"
        error={showError("description", validation.fieldErrors)}
      >
        <Textarea
          {...fieldAria(fieldId("instagram", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="What will people find on this profile?"
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>
    </div>
  );
}
