"use client";

import * as React from "react";
import { ImagePlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { newItemId } from "@/lib/qr/defaults";
import { removeAsset, uploadAsset, UploadError } from "@/lib/qr/uploads-client";
import { UPLOAD_RULES } from "@/lib/qr/uploads";
import { useQRWizard } from "../use-qr-wizard";
import { Field, fieldAria, fieldId, useFocusFirstInvalid, useTouched } from "./form-utils";
import { formatFileSize } from "./file-upload-field";
import { moveItem, RowControls } from "./repeatable";

const FIELD_ORDER = ["images", "title", "description", "ctaLabel", "ctaUrl"] as const;
const MAX_IMAGES = 20;

export function ImagesForm() {
  const { state, updateContent, validation, submitAttempt, user, authReady, publishingConfig, signInToPublish, registerQrCodeId } =
    useQRWizard();
  const { touch, showError } = useTouched(submitAttempt);
  useFocusFirstInvalid(submitAttempt, FIELD_ORDER, validation.fieldErrors, "images");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState<{ current: number; total: number; percent: number } | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Content lives in a ref during multi-file uploads so sequential
  // completions never clobber each other.
  const contentRef = React.useRef(state.content);
  contentRef.current = state.content;

  if (state.content?.type !== "images") return null;
  const data = state.content.data;
  const set = (patch: Partial<typeof data>) =>
    updateContent({ type: "images", data: { ...data, ...patch } });

  const handleFiles = async (files: FileList) => {
    setUploadError(null);
    const room = MAX_IMAGES - data.images.length;
    const list = Array.from(files).slice(0, room);
    if (list.length === 0) {
      setUploadError(`Keep it under ${MAX_IMAGES} images.`);
      return;
    }
    for (let i = 0; i < list.length; i++) {
      setUploading({ current: i + 1, total: list.length, percent: 0 });
      try {
        const result = await uploadAsset({
          file: list[i],
          assetType: "image",
          qrType: "images",
          qrCodeId: state.qrCodeId,
          sortOrder: data.images.length + i,
          onProgress: (percent) => setUploading({ current: i + 1, total: list.length, percent }),
        });
        registerQrCodeId(result.qrCodeId);
        const current = contentRef.current;
        if (current?.type === "images") {
          updateContent({
            type: "images",
            data: {
              ...current.data,
              images: [...current.data.images, { id: newItemId(), asset: result.ref, caption: "" }],
            },
          });
        }
      } catch (err) {
        setUploadError(
          err instanceof UploadError
            ? err.status === 401
              ? "Sign in to upload images — your draft is saved."
              : err.message
            : "The upload failed. Please try again.",
        );
        break;
      }
    }
    setUploading(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const listError = showError("images", validation.fieldErrors);

  return (
    <div className="space-y-5">
      <Field id={fieldId("images", "title")} label="Gallery title" error={showError("title", validation.fieldErrors)}>
        <Input
          {...fieldAria(fieldId("images", "title"), showError("title", validation.fieldErrors))}
          type="text"
          placeholder="Summer collection"
          value={data.title}
          onChange={(e) => set({ title: e.target.value })}
          onBlur={() => touch("title")}
        />
      </Field>

      <Field id={fieldId("images", "description")} label="Description" error={showError("description", validation.fieldErrors)}>
        <Textarea
          {...fieldAria(fieldId("images", "description"), showError("description", validation.fieldErrors))}
          rows={2}
          placeholder="A few words about this gallery."
          value={data.description}
          onChange={(e) => set({ description: e.target.value })}
          onBlur={() => touch("description")}
        />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Images
          <span className="ml-2 font-mono text-[10px] text-muted-foreground uppercase">
            {data.images.length}/{MAX_IMAGES} · at least one
          </span>
        </legend>

        {data.images.map((image, index) => (
          <div key={image.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            {image.asset.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.asset.previewUrl} alt="" className="size-14 shrink-0 rounded-md border object-cover" />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate font-mono text-xs text-muted-foreground">
                {image.asset.fileName} · {formatFileSize(image.asset.fileSize)}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor={fieldId("images", `caption-${image.id}`)} className="sr-only">
                  Caption for image {index + 1}
                </Label>
                <Input
                  id={fieldId("images", `caption-${image.id}`)}
                  type="text"
                  placeholder="Caption (optional)"
                  value={image.caption}
                  onChange={(e) =>
                    set({
                      images: data.images.map((img, i) => (i === index ? { ...img, caption: e.target.value } : img)),
                    })
                  }
                />
              </div>
            </div>
            <RowControls
              index={index}
              count={data.images.length}
              itemLabel={`image ${index + 1}`}
              onMove={(dir) => set({ images: moveItem(data.images, index, dir) })}
              onRemove={() => {
                // Draft-only storage cleanup (published pages may still
                // reference the file until a republish detaches it).
                if (!state.slug) void removeAsset(image.asset.assetId).catch(() => undefined);
                set({ images: data.images.filter((_, i) => i !== index) });
              }}
            />
          </div>
        ))}

        {!publishingConfig.configured ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
            Uploads aren&apos;t configured on this deployment — missing{" "}
            <span className="font-mono text-xs">{publishingConfig.missing.join(", ")}</span>.
          </div>
        ) : authReady && !user ? (
          <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-3">
            <p className="text-sm text-muted-foreground">Sign in to upload images. Everything you&apos;ve typed is kept.</p>
            <Button type="button" variant="outline" size="sm" onClick={signInToPublish}>
              <LogIn aria-hidden />
              Sign in to upload
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={!!uploading || data.images.length >= MAX_IMAGES}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus aria-hidden />
            Add images
          </Button>
        )}

        {uploading && (
          <div role="status" aria-live="polite" className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${uploading.percent}%` }} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Uploading {uploading.current}/{uploading.total}… {uploading.percent}%
            </p>
          </div>
        )}

        {(uploadError ?? listError) && (
          <p role="alert" className="text-xs text-destructive">
            {uploadError ?? listError}
          </p>
        )}

        <p className="text-xs text-muted-foreground">{UPLOAD_RULES.image.label}.</p>

        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_RULES.image.extensions.join(",")}
          multiple
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
          }}
        />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fieldId("images", "ctaLabel")} label="Button text" error={showError("ctaLabel", validation.fieldErrors)}>
          <Input
            {...fieldAria(fieldId("images", "ctaLabel"), showError("ctaLabel", validation.fieldErrors))}
            type="text"
            placeholder="Visit our shop"
            value={data.ctaLabel}
            onChange={(e) => set({ ctaLabel: e.target.value })}
            onBlur={() => touch("ctaLabel")}
          />
        </Field>
        <Field id={fieldId("images", "ctaUrl")} label="Button URL" error={showError("ctaUrl", validation.fieldErrors)}>
          <Input
            {...fieldAria(fieldId("images", "ctaUrl"), showError("ctaUrl", validation.fieldErrors))}
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
