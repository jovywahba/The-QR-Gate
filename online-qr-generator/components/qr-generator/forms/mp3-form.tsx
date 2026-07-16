"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQRWizard } from "../use-qr-wizard";
import { FileUploadField } from "./file-upload-field";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";

const FIELD_ORDER = ["title", "artist", "audioUrl", "file", "description"] as const;

/** URL mode = direct QR; uploaded MP3 = hosted /q/[slug] player page. */
export function MP3Form() {
  const { state, updateContent, validation, submitAttempt } = useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "mp3");

  if (state.content?.type !== "mp3") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "mp3", data: { ...data, ...patch } });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fieldId("mp3", "title")} label="Audio title" required error={showError("title", validation.fieldErrors)}>
          <Input
            {...fieldAria(fieldId("mp3", "title"), showError("title", validation.fieldErrors))}
            type="text"
            placeholder="Episode 12"
            value={data.title}
            onChange={(e) => set({ title: e.target.value })}
            onBlur={() => touch("title")}
          />
        </Field>
        <Field id={fieldId("mp3", "artist")} label="Creator / artist" error={showError("artist", validation.fieldErrors)}>
          <Input
            {...fieldAria(fieldId("mp3", "artist"), showError("artist", validation.fieldErrors))}
            type="text"
            placeholder="The Halfstack Podcast"
            value={data.artist}
            onChange={(e) => set({ artist: e.target.value })}
            onBlur={() => touch("artist")}
          />
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Audio source</legend>
        <RadioGroup
          value={data.mode}
          onValueChange={(mode) => set({ mode: mode as "url" | "upload" })}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <Label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 has-[[data-state=checked]]:border-accent">
            <RadioGroupItem value="url" />
            <span className="text-sm">Public audio URL</span>
          </Label>
          <Label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 has-[[data-state=checked]]:border-accent">
            <RadioGroupItem value="upload" />
            <span className="text-sm">Uploaded MP3</span>
          </Label>
        </RadioGroup>
      </fieldset>

      {data.mode === "url" ? (
        <Field
          id={fieldId("mp3", "audioUrl")}
          label="Audio URL"
          required
          error={showError("audioUrl", validation.fieldErrors)}
          hint="A public https link — the QR opens it directly."
        >
          <Input
            {...fieldAria(fieldId("mp3", "audioUrl"), showError("audioUrl", validation.fieldErrors), true)}
            type="text"
            inputMode="url"
            placeholder="https://example.com/audio.mp3"
            value={data.audioUrl}
            onChange={(e) => set({ audioUrl: e.target.value })}
            onBlur={() => touch("audioUrl")}
          />
        </Field>
      ) : (
        <FileUploadField
          id={fieldId("mp3", "file")}
          label="MP3 file"
          assetType="audio"
          required
          value={data.file}
          onChange={(file) => set({ file })}
          error={showError("file", validation.fieldErrors)}
        />
      )}

      <FileUploadField
        id={fieldId("mp3", "cover")}
        label="Cover image"
        assetType="cover"
        value={data.cover}
        onChange={(cover) => set({ cover })}
      />

      <Field id={fieldId("mp3", "description")} label="Description" error={showError("description", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("mp3", "description"), showError("description", validation.fieldErrors))}
          rows={3}
          placeholder="What are people about to hear?"
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      {data.mode === "upload" && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5 pr-4">
            <Label htmlFor={fieldId("mp3", "allowDownload")}>Allow download</Label>
            <p className="text-xs text-muted-foreground">Show a download button on the public page.</p>
          </div>
          <Switch
            id={fieldId("mp3", "allowDownload")}
            checked={data.allowDownload}
            onCheckedChange={(allowDownload) => set({ allowDownload })}
          />
        </div>
      )}
    </div>
  );
}
