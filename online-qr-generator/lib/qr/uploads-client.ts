"use client";

import type { AssetRef, QRType } from "./types";
import { checkMagicBytes, checkUploadMetadata, type AssetType } from "./uploads";

/**
 * Client-side upload orchestration:
 *  1. pre-flight (size/extension/MIME + local magic-byte sniff),
 *  2. ask the server for a signed upload URL (auth required),
 *  3. PUT straight to storage via XHR (real progress events),
 *  4. confirm — the server re-verifies the stored bytes and creates
 *     the qr_assets row.
 * Local File objects are never persisted; the returned AssetRef is.
 */

export class UploadError extends Error {
  constructor(
    message: string,
    public status?: number,
    public missing?: string[],
  ) {
    super(message);
  }
}

async function parseError(response: Response): Promise<UploadError> {
  try {
    const body = (await response.json()) as { error?: string; missing?: string[] };
    return new UploadError(body.error ?? "Something went wrong.", response.status, body.missing);
  } catch {
    return new UploadError("Something went wrong.", response.status);
  }
}

export async function uploadAsset(args: {
  file: File;
  assetType: AssetType;
  qrType: QRType;
  qrCodeId?: string;
  sortOrder?: number;
  onProgress?: (percent: number) => void;
}): Promise<{ qrCodeId: string; ref: AssetRef }> {
  const { file, assetType, qrType, qrCodeId, sortOrder, onProgress } = args;

  // Pre-flight locally so obvious mistakes never leave the machine.
  const meta = checkUploadMetadata({
    assetType,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
  if (!meta.ok) throw new UploadError(meta.error, 400);
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const bytes = checkMagicBytes(assetType, head);
  if (!bytes.ok) throw new UploadError(bytes.error, 400);

  // 1 — signed upload URL.
  const startResponse = await fetch("/api/qr/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      qrType,
      assetType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      qrCodeId,
    }),
  });
  if (!startResponse.ok) throw await parseError(startResponse);
  const start = (await startResponse.json()) as {
    qrCodeId: string;
    storagePath: string;
    signedUrl: string;
  };

  // 2 — direct-to-storage PUT with progress.
  onProgress?.(0);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", start.signedUrl);
    xhr.setRequestHeader("x-upsert", "false");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new UploadError("The upload failed. Please try again.", xhr.status));
    xhr.onerror = () => reject(new UploadError("The upload failed — check your connection.", 0));
    xhr.send(file);
  });

  // 3 — server-side verification + asset row.
  const confirmResponse = await fetch("/api/qr/upload/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      qrCodeId: start.qrCodeId,
      storagePath: start.storagePath,
      assetType,
      fileName: file.name,
      mimeType: file.type,
      sortOrder,
    }),
  });
  if (!confirmResponse.ok) throw await parseError(confirmResponse);
  const confirmed = (await confirmResponse.json()) as {
    assetId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    previewUrl: string | null;
  };

  return {
    qrCodeId: start.qrCodeId,
    ref: {
      assetId: confirmed.assetId,
      fileName: confirmed.fileName,
      fileSize: confirmed.fileSize,
      mimeType: confirmed.mimeType,
      previewUrl: confirmed.previewUrl ?? undefined,
    },
  };
}

export async function removeAsset(assetId: string): Promise<void> {
  const response = await fetch("/api/qr/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId }),
  });
  if (!response.ok && response.status !== 404) throw await parseError(response);
}

/** Refresh a signed preview URL for an owned asset (draft restore). */
export async function refreshAssetPreview(assetId: string): Promise<string | null> {
  const response = await fetch(`/api/qr/upload?assetId=${encodeURIComponent(assetId)}`);
  if (!response.ok) return null;
  const body = (await response.json()) as { previewUrl: string | null };
  return body.previewUrl;
}

export async function publishQR(args: {
  qrCodeId?: string;
  type: QRType;
  content: unknown;
  design: unknown;
}): Promise<{ qrCodeId: string; slug: string; publicUrl: string }> {
  const response = await fetch("/api/qr/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as { qrCodeId: string; slug: string; publicUrl: string };
}
