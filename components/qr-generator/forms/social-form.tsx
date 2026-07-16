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
import { SOCIAL_PLATFORM_LABELS } from "@/lib/qr/social";
import type { SocialItem, SocialPlatform } from "@/lib/qr/types";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";
import { moveItem, RowControls } from "./repeatable";

const FIELD_ORDER = ["title", "description", "links"] as const;

export function SocialForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "social");

  if (state.content?.type !== "social") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "social", data: { ...data, ...patch } });
  const setItem = (index: number, patch: Partial<SocialItem>) =>
    set({ links: data.links.map((l, i) => (i === index ? { ...l, ...patch } : l)) });

  const listError = showError("links", validation.fieldErrors);

  return (
    <div className="space-y-5">
      <Field id={fieldId("social", "title")} label="Page title" error={showError("title", validation.fieldErrors)}>
        <Input
          {...fieldAria(fieldId("social", "title"), showError("title", validation.fieldErrors))}
          type="text"
          placeholder="Follow us"
          value={data.title}
          onChange={(e) => set({ title: e.target.value })}
          onBlur={() => touch("title")}
        />
      </Field>

      <Field id={fieldId("social", "description")} label="Description" error={showError("description", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("social", "description"), showError("description", validation.fieldErrors))}
          rows={2}
          placeholder="All our channels in one place."
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      <FileUploadField
        id={fieldId("social", "image")}
        label="Profile image"
        assetType="logo"
        value={data.image}
        onChange={(image) => set({ image })}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Social links
          <span className="ml-2 font-mono text-[10px] text-muted-foreground uppercase">at least one</span>
        </legend>

        {data.links.map((item, index) => {
          const urlId = fieldId("social", `links.${index}.url`);
          const urlError = showError(`links.${index}.url`, validation.fieldErrors);
          return (
            <div key={item.id} className="space-y-3 rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  {SOCIAL_PLATFORM_LABELS[item.platform]}
                </p>
                <RowControls
                  index={index}
                  count={data.links.length}
                  itemLabel={`${SOCIAL_PLATFORM_LABELS[item.platform]} link`}
                  onMove={(dir) => set({ links: moveItem(data.links, index, dir) })}
                  onRemove={() => set({ links: data.links.filter((_, i) => i !== index) })}
                  canRemove={data.links.length > 1}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[10rem_1fr_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor={fieldId("social", `links.${index}.platform`)}>Platform</Label>
                  <Select
                    value={item.platform}
                    onValueChange={(platform) => setItem(index, { platform: platform as SocialPlatform })}
                  >
                    <SelectTrigger id={fieldId("social", `links.${index}.platform`)} className="w-full">
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
                <div className="space-y-1.5">
                  <Label htmlFor={fieldId("social", `links.${index}.label`)}>Label</Label>
                  <Input
                    id={fieldId("social", `links.${index}.label`)}
                    type="text"
                    placeholder={SOCIAL_PLATFORM_LABELS[item.platform]}
                    value={item.label}
                    onChange={(e) => setItem(index, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={urlId}>URL</Label>
                  <Input
                    id={urlId}
                    aria-invalid={urlError ? true : undefined}
                    aria-describedby={urlError ? `${urlId}-error` : undefined}
                    type="text"
                    inputMode="url"
                    placeholder="https://…"
                    value={item.url}
                    onChange={(e) => setItem(index, { url: e.target.value })}
                    onBlur={() => touch(`links.${index}.url`)}
                  />
                  {urlError && (
                    <p id={`${urlId}-error`} role="alert" className="text-xs text-destructive">
                      {urlError}
                    </p>
                  )}
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
          disabled={data.links.length >= 20}
          onClick={() =>
            set({ links: [...data.links, { id: newItemId(), platform: "instagram", label: "", url: "" }] })
          }
        >
          <Plus aria-hidden />
          Add social link
        </Button>
      </fieldset>
    </div>
  );
}
