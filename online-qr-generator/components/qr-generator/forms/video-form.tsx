"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { parseVideoUrl } from "@/lib/qr/embeds";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = ["title", "videoUrl", "file", "description", "ctaLabel", "ctaUrl"] as const;

/**
 * URL mode = direct QR (the video URL itself). Upload mode = hosted:
 * the QR points at the published /q/[slug] page with a safe player.
 */
export function VideoForm() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "video");

  if (state.content?.type !== "video") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "video", data: { ...data, ...patch } });

  const urlError = showError("videoUrl", validation.fieldErrors);
  const parsed = data.mode === "url" ? parseVideoUrl(data.videoUrl) : null;

  return (
    <div className="space-y-5">
      <Field id={fieldId("video", "title")} label="Video title" required error={showError("title", validation.fieldErrors)}>
        <Input
          {...fieldAria(fieldId("video", "title"), showError("title", validation.fieldErrors))}
          type="text"
          placeholder="Product walkthrough"
          value={data.title}
          onChange={(e) => set({ title: e.target.value })}
          onBlur={() => touch("title")}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Video source</legend>
        <RadioGroup
          value={data.mode}
          onValueChange={(mode) => set({ mode: mode as "url" | "upload" })}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <Label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 has-[[data-state=checked]]:border-accent">
            <RadioGroupItem value="url" />
            <span className="text-sm">Public video URL</span>
          </Label>
          <Label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 has-[[data-state=checked]]:border-accent">
            <RadioGroupItem value="upload" />
            <span className="text-sm">Uploaded video</span>
          </Label>
        </RadioGroup>
      </fieldset>

      {data.mode === "url" ? (
        <Field
          id={fieldId("video", "videoUrl")}
          label="Video URL"
          required
          error={urlError}
          hint={
            parsed
              ? parsed.provider === "youtube" || parsed.provider === "vimeo"
                ? `Recognized ${parsed.provider === "youtube" ? "YouTube" : "Vimeo"} video — the QR opens it directly.`
                : "Direct video link — the QR opens it directly."
              : "YouTube, Vimeo, or a direct https video link."
          }
        >
          <Input
            {...fieldAria(fieldId("video", "videoUrl"), urlError, true)}
            type="text"
            inputMode="url"
            placeholder="https://youtube.com/watch?v=…"
            value={data.videoUrl}
            onChange={(e) => set({ videoUrl: e.target.value })}
            onBlur={() => touch("videoUrl")}
          />
        </Field>
      ) : (
        <FileUploadField
          id={fieldId("video", "file")}
          label="Video file"
          assetType="video"
          required
          value={data.file}
          onChange={(file) => set({ file })}
          error={showError("file", validation.fieldErrors)}
        />
      )}

      <FileUploadField
        id={fieldId("video", "thumbnail")}
        label="Thumbnail"
        assetType="thumbnail"
        value={data.thumbnail}
        onChange={(thumbnail) => set({ thumbnail })}
      />

      <Field id={fieldId("video", "description")} label="Description" error={showError("description", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("video", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="What's this video about?"
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fieldId("video", "ctaLabel")} label="Button text" error={showError("ctaLabel", validation.fieldErrors)}>
          <Input
            {...fieldAria(fieldId("video", "ctaLabel"), showError("ctaLabel", validation.fieldErrors))}
            type="text"
            placeholder="Visit our site"
            value={data.ctaLabel}
            onChange={(e) => set({ ctaLabel: e.target.value })}
            onBlur={() => touch("ctaLabel")}
          />
        </Field>
        <Field id={fieldId("video", "ctaUrl")} label="Button URL" error={showError("ctaUrl", validation.fieldErrors)}>
          <Input
            {...fieldAria(fieldId("video", "ctaUrl"), showError("ctaUrl", validation.fieldErrors))}
            type="text"
            inputMode="url"
            placeholder="example.com"
            value={data.ctaUrl}
            onChange={(e) => set({ ctaUrl: e.target.value })}
            onBlur={() => touch("ctaUrl")}
          />
        </Field>
      </div>
    </div>
  );
}
