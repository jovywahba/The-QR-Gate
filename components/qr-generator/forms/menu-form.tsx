"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { menuHasBusinessExtras } from "@/lib/qr/payloads";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = [
  "businessName",
  "menuTitle",
  "description",
  "file",
  "menuUrl",
  "phone",
  "email",
  "address",
  "ctaLabel",
  "ctaUrl",
] as const;

/**
 * Uploaded-PDF menus publish a /q/[slug] page. URL menus stay a direct
 * QR — unless business details are added, which upgrades them to the
 * branded published page.
 */
export function MenuForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "menu");

  if (state.content?.type !== "menu") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "menu", data: { ...data, ...patch } });

  const textField = (
    field: (typeof FIELD_ORDER)[number],
    label: string,
    placeholder: string,
    opts: { required?: boolean; inputMode?: "tel" | "email" | "url"; hint?: string } = {},
  ) => {
    const id = fieldId("menu", field);
    const error = showError(field, validation.fieldErrors);
    return (
      <Field id={id} label={label} required={opts.required} error={error} hint={opts.hint}>
        <Input
          {...fieldAria(id, error, !!opts.hint)}
          type="text"
          inputMode={opts.inputMode}
          placeholder={placeholder}
          value={data[field] as string}
          onChange={(e) => set({ [field]: e.target.value })}
          onBlur={() => touch(field)}
        />
      </Field>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {textField("businessName", "Business or restaurant name", "Nile Bistro")}
        {textField("menuTitle", "Menu title", "Dinner menu")}
      </div>

      <Field id={fieldId("menu", "description")} label="Description" error={showError("description", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("menu", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="Seasonal dishes, updated weekly."
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      <FileUploadField
        id={fieldId("menu", "logo")}
        label="Logo"
        assetType="logo"
        value={data.logo}
        onChange={(logo) => set({ logo })}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Menu source</legend>
        <RadioGroup
          value={data.mode}
          onValueChange={(mode) => set({ mode: mode as "pdf" | "url" })}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <Label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 has-[[data-state=checked]]:border-accent">
            <RadioGroupItem value="pdf" />
            <span className="text-sm">Uploaded PDF menu</span>
          </Label>
          <Label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 has-[[data-state=checked]]:border-accent">
            <RadioGroupItem value="url" />
            <span className="text-sm">Public menu URL</span>
          </Label>
        </RadioGroup>
      </fieldset>

      {data.mode === "pdf" ? (
        <FileUploadField
          id={fieldId("menu", "file")}
          label="Menu PDF"
          assetType="pdf"
          required
          value={data.file}
          onChange={(file) => set({ file })}
          error={showError("file", validation.fieldErrors)}
        />
      ) : (
        textField("menuUrl", "Menu URL", "https://example.com/menu", {
          required: true,
          inputMode: "url",
          hint: menuHasBusinessExtras(data)
            ? "Business details added — the QR points at your branded menu page."
            : "No extra details — the QR opens this URL directly.",
        })
      )}

      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Contact
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {textField("phone", "Contact phone", "+20 2 1234 5678", { inputMode: "tel" })}
          {textField("email", "Contact email", "hello@bistro.com", { inputMode: "email" })}
        </div>
        {textField("address", "Address", "12 Nile St., Cairo")}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {textField("ctaLabel", "Button text", "Book a table")}
        {textField("ctaUrl", "Button URL", "example.com/reservations", { inputMode: "url" })}
      </div>
    </div>
  );
}
