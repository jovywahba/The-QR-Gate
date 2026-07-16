"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeUrl } from "@/lib/qr/payloads";
import { useQRWizard } from "../use-qr-wizard";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = ["url", "title", "description"] as const;

export function WebsiteForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "website");

  if (state.content?.type !== "website") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "website", data: { ...data, ...patch } });

  const urlError = showError("url", validation.fieldErrors);
  const normalized = normalizeUrl(data.url);

  return (
    <div className="space-y-5">
      <Field
        id={fieldId("website", "url")}
        label="Website URL"
        required
        error={urlError}
        hint={
          normalized && normalized !== data.url.trim()
            ? <>Will encode as <span className="font-mono">{normalized}</span></>
            : "e.g. example.com — https:// is added for you."
        }
      >
        <Input
          {...fieldAria(fieldId("website", "url"), urlError, true)}
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="example.com"
          value={data.url}
          onChange={(e) => set({ url: e.target.value })}
          onBlur={() => touch("url")}
        />
      </Field>

      <Field
        id={fieldId("website", "title")}
        label="Title"
        error={showError("title", validation.fieldErrors)}
        hint="Only used to label this QR — not encoded in the code."
      >
        <Input
          {...fieldAria(fieldId("website", "title"), showError("title", validation.fieldErrors), true)}
          type="text"
          placeholder="My website"
          value={data.title ?? ""}
          onChange={(e) => set({ title: e.target.value })}
          onBlur={() => touch("title")}
        />
      </Field>

      <Field
        id={fieldId("website", "description")}
        label="Description"
        error={showError("description", validation.fieldErrors)}
      >
        <Textarea
          {...fieldAria(fieldId("website", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="What does this link lead to?"
          value={data.description ?? ""}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>
    </div>
  );
}
