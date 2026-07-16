"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = ["file", "title", "description", "buttonLabel"] as const;

/** Hosted QR — the code points at the published /q/[slug] page. */
export function PDFForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "pdf");

  if (state.content?.type !== "pdf") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "pdf", data: { ...data, ...patch } });

  return (
    <div className="space-y-5">
      <FileUploadField
        id={fieldId("pdf", "file")}
        label="PDF file"
        assetType="pdf"
        required
        value={data.file}
        onChange={(file) => set({ file })}
        error={showError("file", validation.fieldErrors)}
      />

      <Field
        id={fieldId("pdf", "title")}
        label="Document title"
        required
        error={showError("title", validation.fieldErrors)}
      >
        <Input
          {...fieldAria(fieldId("pdf", "title"), showError("title", validation.fieldErrors))}
          type="text"
          placeholder="2026 Product Catalog"
          value={data.title}
          onChange={(e) => set({ title: e.target.value })}
          onBlur={() => touch("title")}
        />
      </Field>

      <Field
        id={fieldId("pdf", "description")}
        label="Document description"
        error={showError("description", validation.fieldErrors)}
      >
        <Textarea
          {...fieldAria(fieldId("pdf", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="What's inside this document?"
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      <Field
        id={fieldId("pdf", "buttonLabel")}
        label="Button label"
        required
        error={showError("buttonLabel", validation.fieldErrors)}
        hint='Shown on the public page — default "Open PDF".'
      >
        <Input
          {...fieldAria(fieldId("pdf", "buttonLabel"), showError("buttonLabel", validation.fieldErrors), true)}
          type="text"
          placeholder="Open PDF"
          value={data.buttonLabel}
          onChange={(e) => set({ buttonLabel: e.target.value })}
          onBlur={() => touch("buttonLabel")}
        />
      </Field>
    </div>
  );
}
