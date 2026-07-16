"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQRWizard } from "../use-qr-wizard";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = [
  "firstName",
  "lastName",
  "company",
  "jobTitle",
  "mobile",
  "phone",
  "email",
  "website",
  "street",
  "city",
  "country",
  "note",
] as const;

type TextFieldSpec = {
  field: (typeof FIELD_ORDER)[number];
  label: string;
  required?: boolean;
  placeholder: string;
  inputMode?: "tel" | "email" | "url";
  autoComplete?: string;
};

const IDENTITY_FIELDS: TextFieldSpec[] = [
  { field: "firstName", label: "First name", required: true, placeholder: "Sara", autoComplete: "given-name" },
  { field: "lastName", label: "Last name", required: true, placeholder: "Hassan", autoComplete: "family-name" },
  { field: "company", label: "Company", placeholder: "Acme Inc.", autoComplete: "organization" },
  { field: "jobTitle", label: "Job title", placeholder: "Product Manager", autoComplete: "organization-title" },
];

const CONTACT_FIELDS: TextFieldSpec[] = [
  { field: "mobile", label: "Mobile number", placeholder: "+20 100 123 4567", inputMode: "tel", autoComplete: "tel" },
  { field: "phone", label: "Phone number", placeholder: "+20 2 1234 5678", inputMode: "tel", autoComplete: "tel" },
  { field: "email", label: "Email", placeholder: "sara@example.com", inputMode: "email", autoComplete: "email" },
  { field: "website", label: "Website", placeholder: "example.com", inputMode: "url", autoComplete: "url" },
];

const ADDRESS_FIELDS: TextFieldSpec[] = [
  { field: "street", label: "Street address", placeholder: "12 Nile St.", autoComplete: "street-address" },
  { field: "city", label: "City", placeholder: "Cairo", autoComplete: "address-level2" },
  { field: "country", label: "Country", placeholder: "Egypt", autoComplete: "country-name" },
];

export function VCardForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "vcard");

  if (state.content?.type !== "vcard") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "vcard", data: { ...data, ...patch } });

  const renderField = (spec: TextFieldSpec) => {
    const id = fieldId("vcard", spec.field);
    const error = showError(spec.field, validation.fieldErrors);
    return (
      <Field key={spec.field} id={id} label={spec.label} required={spec.required} error={error}>
        <Input
          {...fieldAria(id, error)}
          type="text"
          inputMode={spec.inputMode}
          autoComplete={spec.autoComplete}
          placeholder={spec.placeholder}
          value={(data[spec.field] as string | undefined) ?? ""}
          onChange={(e) => set({ [spec.field]: e.target.value })}
          onBlur={() => touch(spec.field)}
        />
      </Field>
    );
  };

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Identity
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">{IDENTITY_FIELDS.map(renderField)}</div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Contact
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">{CONTACT_FIELDS.map(renderField)}</div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Address
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">{ADDRESS_FIELDS.map(renderField)}</div>
      </fieldset>

      <Field
        id={fieldId("vcard", "note")}
        label="Note"
        error={showError("note", validation.fieldErrors)}
      >
        <Textarea
          {...fieldAria(fieldId("vcard", "note"), showError("note", validation.fieldErrors))}
          rows={3}
          placeholder="Anything else worth knowing"
          value={data.note ?? ""}
          onChange={(e) => set({ note: e.target.value })}
          onBlur={() => touch("note")}
        />
      </Field>
    </div>
  );
}
