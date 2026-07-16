"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { newItemId } from "@/lib/qr/defaults";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/qr/social";
import type { SocialItem, SocialPlatform, WeekDay } from "@/lib/qr/types";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";
import { moveItem, RowControls } from "./repeatable";

const FIELD_ORDER = [
  "name",
  "category",
  "headline",
  "description",
  "phone",
  "email",
  "website",
  "street",
  "city",
  "country",
  "ctaLabel",
  "ctaUrl",
] as const;

const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function BusinessForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "business");

  if (state.content?.type !== "business") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "business", data: { ...data, ...patch } });
  const setSocial = (index: number, patch: Partial<SocialItem>) =>
    set({ socials: data.socials.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  const textField = (
    field: (typeof FIELD_ORDER)[number],
    label: string,
    placeholder: string,
    opts: { required?: boolean; inputMode?: "tel" | "email" | "url"; autoComplete?: string } = {},
  ) => {
    const id = fieldId("business", field);
    const error = showError(field, validation.fieldErrors);
    return (
      <Field id={id} label={label} required={opts.required} error={error}>
        <Input
          {...fieldAria(id, error)}
          type="text"
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          placeholder={placeholder}
          value={data[field] as string}
          onChange={(e) => set({ [field]: e.target.value })}
          onBlur={() => touch(field)}
        />
      </Field>
    );
  };

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Business
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {textField("name", "Business name", "Nile Bistro", { required: true })}
          {textField("category", "Category", "Restaurant")}
        </div>
        {textField("headline", "Headline", "Fresh, seasonal, riverside.")}
        <Field
          id={fieldId("business", "description")}
          label="Description"
          error={showError("description", validation.fieldErrors)}
        >
          <Textarea
            {...fieldAria(fieldId("business", "description"), showError("description", validation.fieldErrors))}
            rows={3}
            placeholder="Tell people what you do."
            value={data.description}
            onChange={(e) => set({ description: e.target.value })}
            onBlur={() => touch("description")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileUploadField
            id={fieldId("business", "logo")}
            label="Logo"
            assetType="logo"
            value={data.logo}
            onChange={(logo) => set({ logo })}
          />
          <FileUploadField
            id={fieldId("business", "cover")}
            label="Cover image"
            assetType="cover"
            value={data.cover}
            onChange={(cover) => set({ cover })}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Contact
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {textField("phone", "Phone", "+20 2 1234 5678", { inputMode: "tel", autoComplete: "tel" })}
          {textField("email", "Email", "hello@bistro.com", { inputMode: "email", autoComplete: "email" })}
        </div>
        {textField("website", "Website", "example.com", { inputMode: "url", autoComplete: "url" })}
        <div className="grid gap-4 sm:grid-cols-3">
          {textField("street", "Street address", "12 Nile St.")}
          {textField("city", "City", "Cairo")}
          {textField("country", "Country", "Egypt")}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Opening hours
        </legend>
        <div className="divide-y rounded-lg border bg-card">
          {data.hours.map((row, index) => {
            const opensId = fieldId("business", `hours.${index}.opens`);
            const closesId = fieldId("business", `hours.${index}.closes`);
            const opensError = showError(`hours.${index}.opens`, validation.fieldErrors);
            const closesError = showError(`hours.${index}.closes`, validation.fieldErrors);
            return (
              <div key={row.day} className="flex flex-wrap items-center gap-3 p-3">
                <span className="w-24 text-sm font-medium">{DAY_LABELS[row.day]}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    id={fieldId("business", `hours.${index}.open`)}
                    checked={!row.closed}
                    onCheckedChange={(open) =>
                      set({ hours: data.hours.map((h, i) => (i === index ? { ...h, closed: !open } : h)) })
                    }
                    aria-label={`${DAY_LABELS[row.day]} open`}
                  />
                  <span className="w-12 text-xs text-muted-foreground">{row.closed ? "Closed" : "Open"}</span>
                </div>
                {!row.closed && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={opensId} className="sr-only">
                      {DAY_LABELS[row.day]} opening time
                    </Label>
                    <Input
                      id={opensId}
                      type="time"
                      className="w-28"
                      aria-invalid={opensError ? true : undefined}
                      value={row.opens}
                      onChange={(e) =>
                        set({ hours: data.hours.map((h, i) => (i === index ? { ...h, opens: e.target.value } : h)) })
                      }
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Label htmlFor={closesId} className="sr-only">
                      {DAY_LABELS[row.day]} closing time
                    </Label>
                    <Input
                      id={closesId}
                      type="time"
                      className="w-28"
                      aria-invalid={closesError ? true : undefined}
                      value={row.closes}
                      onChange={(e) =>
                        set({ hours: data.hours.map((h, i) => (i === index ? { ...h, closes: e.target.value } : h)) })
                      }
                    />
                  </div>
                )}
                {(opensError ?? closesError) && (
                  <p role="alert" className="w-full text-xs text-destructive">
                    {opensError ?? closesError}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Social links
        </legend>
        {data.socials.map((item, index) => {
          const urlId = fieldId("business", `socials.${index}.url`);
          const urlError = showError(`socials.${index}.url`, validation.fieldErrors);
          return (
            <div key={item.id} className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
              <div className="w-36 space-y-1.5">
                <Label htmlFor={fieldId("business", `socials.${index}.platform`)}>Platform</Label>
                <Select
                  value={item.platform}
                  onValueChange={(platform) => setSocial(index, { platform: platform as SocialPlatform })}
                >
                  <SelectTrigger id={fieldId("business", `socials.${index}.platform`)} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SOCIAL_PLATFORM_LABELS) as SocialPlatform[]).map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {SOCIAL_PLATFORM_LABELS[platform]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-40 flex-1 space-y-1.5">
                <Label htmlFor={urlId}>URL</Label>
                <Input
                  id={urlId}
                  aria-invalid={urlError ? true : undefined}
                  aria-describedby={urlError ? `${urlId}-error` : undefined}
                  type="text"
                  inputMode="url"
                  placeholder="https://…"
                  value={item.url}
                  onChange={(e) => setSocial(index, { url: e.target.value })}
                  onBlur={() => touch(`socials.${index}.url`)}
                />
                {urlError && (
                  <p id={`${urlId}-error`} role="alert" className="text-xs text-destructive">
                    {urlError}
                  </p>
                )}
              </div>
              <RowControls
                index={index}
                count={data.socials.length}
                itemLabel={`${SOCIAL_PLATFORM_LABELS[item.platform]} link`}
                onMove={(dir) => set({ socials: moveItem(data.socials, index, dir) })}
                onRemove={() => set({ socials: data.socials.filter((_, i) => i !== index) })}
              />
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={data.socials.length >= 10}
          onClick={() =>
            set({ socials: [...data.socials, { id: newItemId(), platform: "instagram", label: "", url: "" }] })
          }
        >
          <Plus aria-hidden />
          Add social link
        </Button>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Primary button
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {textField("ctaLabel", "Button label", "Book a table")}
          {textField("ctaUrl", "Button URL", "example.com/book", { inputMode: "url" })}
        </div>
      </fieldset>
    </div>
  );
}
