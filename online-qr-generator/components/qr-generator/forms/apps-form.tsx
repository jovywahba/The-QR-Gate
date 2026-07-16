"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = [
  "appName",
  "description",
  "appStoreUrl",
  "playStoreUrl",
  "appGalleryUrl",
  "websiteUrl",
] as const;

/** Hosted QR — a smart /q/[slug] page showing only the stores you add. */
export function AppsForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "apps");

  if (state.content?.type !== "apps") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "apps", data: { ...data, ...patch } });

  const urlField = (
    field: (typeof FIELD_ORDER)[number],
    label: string,
    placeholder: string,
    required = false,
  ) => {
    const id = fieldId("apps", field);
    const error = showError(field, validation.fieldErrors);
    return (
      <Field id={id} label={label} required={required} error={error}>
        <Input
          {...fieldAria(id, error)}
          type="text"
          inputMode="url"
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
      <Field id={fieldId("apps", "appName")} label="App name" required error={showError("appName", validation.fieldErrors)}>
        <Input
          {...fieldAria(fieldId("apps", "appName"), showError("appName", validation.fieldErrors))}
          type="text"
          placeholder="My App"
          value={data.appName}
          onChange={(e) => set({ appName: e.target.value })}
          onBlur={() => touch("appName")}
        />
      </Field>

      <Field id={fieldId("apps", "description")} label="App description" error={showError("description", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("apps", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="What does the app do?"
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      <FileUploadField
        id={fieldId("apps", "icon")}
        label="App icon"
        assetType="icon"
        value={data.icon}
        onChange={(icon) => set({ icon })}
      />

      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Store links — add at least one
        </legend>
        {urlField("appStoreUrl", "Apple App Store URL", "https://apps.apple.com/app/…")}
        {urlField("playStoreUrl", "Google Play URL", "https://play.google.com/store/apps/details?id=…")}
        {urlField("appGalleryUrl", "Huawei AppGallery URL", "https://appgallery.huawei.com/app/…")}
        {urlField("websiteUrl", "Fallback website URL", "example.com")}
      </fieldset>
    </div>
  );
}
