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
import { Textarea } from "@/components/ui/textarea";
import { newItemId } from "@/lib/qr/defaults";
import type { LinkItem } from "@/lib/qr/types";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";
import { moveItem, RowControls } from "./repeatable";

const FIELD_ORDER = ["title", "description", "links"] as const;

/** Icon options rendered with Lucide on the public page. */
export const LINK_ICON_OPTIONS = [
  { value: "link", label: "Link" },
  { value: "globe", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "music", label: "Music" },
  { value: "mail", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "map-pin", label: "Location" },
  { value: "shopping-bag", label: "Shop" },
] as const;

export function LinksForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "links");

  if (state.content?.type !== "links") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "links", data: { ...data, ...patch } });
  const setLink = (index: number, patch: Partial<LinkItem>) =>
    set({ links: data.links.map((l, i) => (i === index ? { ...l, ...patch } : l)) });

  const listError = showError("links", validation.fieldErrors);

  return (
    <div className="space-y-5">
      <Field id={fieldId("links", "title")} label="Page title" required error={showError("title", validation.fieldErrors)}>
        <Input
          {...fieldAria(fieldId("links", "title"), showError("title", validation.fieldErrors))}
          type="text"
          placeholder="All my links"
          value={data.title}
          onChange={(e) => set({ title: e.target.value })}
          onBlur={() => touch("title")}
        />
      </Field>

      <Field id={fieldId("links", "description")} label="Description" error={showError("description", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("links", "description"), showError("description", validation.fieldErrors))}
          rows={2}
          placeholder="Everything in one place."
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      <FileUploadField
        id={fieldId("links", "image")}
        label="Profile image or logo"
        assetType="logo"
        value={data.image}
        onChange={(image) => set({ image })}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Links
          <span className="ml-2 font-mono text-[10px] text-muted-foreground uppercase">at least one</span>
        </legend>

        {data.links.map((link, index) => {
          const labelId = fieldId("links", `links.${index}.label`);
          const urlId = fieldId("links", `links.${index}.url`);
          const labelError = showError(`links.${index}.label`, validation.fieldErrors);
          const urlError = showError(`links.${index}.url`, validation.fieldErrors);
          return (
            <div key={link.id} className="space-y-3 rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  Link {index + 1}
                </p>
                <RowControls
                  index={index}
                  count={data.links.length}
                  itemLabel={`link ${index + 1}`}
                  onMove={(dir) => set({ links: moveItem(data.links, index, dir) })}
                  onRemove={() => set({ links: data.links.filter((_, i) => i !== index) })}
                  canRemove={data.links.length > 1}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
                <div className="space-y-1.5">
                  <Label htmlFor={labelId}>Label</Label>
                  <Input
                    id={labelId}
                    aria-invalid={labelError ? true : undefined}
                    aria-describedby={labelError ? `${labelId}-error` : undefined}
                    type="text"
                    placeholder="My website"
                    value={link.label}
                    onChange={(e) => setLink(index, { label: e.target.value })}
                    onBlur={() => touch(`links.${index}.label`)}
                  />
                  {labelError && (
                    <p id={`${labelId}-error`} role="alert" className="text-xs text-destructive">
                      {labelError}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={urlId}>URL</Label>
                  <Input
                    id={urlId}
                    aria-invalid={urlError ? true : undefined}
                    aria-describedby={urlError ? `${urlId}-error` : undefined}
                    type="text"
                    inputMode="url"
                    placeholder="example.com"
                    value={link.url}
                    onChange={(e) => setLink(index, { url: e.target.value })}
                    onBlur={() => touch(`links.${index}.url`)}
                  />
                  {urlError && (
                    <p id={`${urlId}-error`} role="alert" className="text-xs text-destructive">
                      {urlError}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={fieldId("links", `links.${index}.icon`)}>Icon</Label>
                  <Select value={link.icon} onValueChange={(icon) => setLink(index, { icon })}>
                    <SelectTrigger id={fieldId("links", `links.${index}.icon`)} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_ICON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}

        {listError && (
          <p role="alert" className="text-xs text-destructive">
            {listError}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={data.links.length >= 50}
          onClick={() =>
            set({ links: [...data.links, { id: newItemId(), label: "", url: "", icon: "link" }] })
          }
        >
          <Plus aria-hidden />
          Add link
        </Button>
      </fieldset>
    </div>
  );
}
