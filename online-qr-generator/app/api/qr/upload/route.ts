import { NextResponse } from "next/server";
import { serverSupabaseConfig } from "@/lib/qr/config";
import { isQRType } from "@/lib/qr/registry";
import {
  buildStoragePath,
  checkUploadMetadata,
  isAssetType,
  sanitizeFileName,
} from "@/lib/qr/uploads";
import { createClient } from "@/lib/supabase/server";

/**
 * Upload step 1 — hand the authenticated owner a signed upload URL
 * into the PRIVATE bucket (browser uploads straight to storage, so
 * large files never transit this function). The asset row is only
 * created after /api/qr/upload/confirm re-verifies the stored bytes.
 *
 * GET refreshes a signed preview URL for an owned asset (draft restore).
 * DELETE removes an owned asset (row + object).
 */

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(request: Request) {
  const config = serverSupabaseConfig();
  if (!config.configured) {
    return jsonError("Publishing isn't configured on this deployment.", 503, { missing: config.missing });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Sign in to upload files.", 401);

  let body: {
    qrType?: string;
    assetType?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    qrCodeId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  if (!isQRType(body.qrType)) return jsonError("Unknown QR type.", 400);
  if (!isAssetType(body.assetType)) return jsonError("Unknown asset type.", 400);
  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";

  const check = checkUploadMetadata({ assetType: body.assetType, fileName, fileSize, mimeType });
  if (!check.ok) return jsonError(check.error, 400);

  // Reuse the caller's draft row or create one (RLS scopes everything to the owner).
  let qrCodeId = typeof body.qrCodeId === "string" ? body.qrCodeId : null;
  if (qrCodeId) {
    const { data: row } = await supabase.from("qr_codes").select("id").eq("id", qrCodeId).maybeSingle();
    if (!row) return jsonError("QR code not found.", 404);
  } else {
    const { data: row, error } = await supabase
      .from("qr_codes")
      .insert({ user_id: user.id, type: body.qrType, status: "draft" })
      .select("id")
      .single();
    if (error || !row) {
      console.error("qr draft insert failed:", error?.code);
      return jsonError("Couldn't start the upload. Please try again.", 500);
    }
    qrCodeId = row.id as string;
  }

  const storagePath = buildStoragePath(user.id, qrCodeId, fileName);
  const { data: signed, error: signError } = await supabase.storage
    .from("qr-private")
    .createSignedUploadUrl(storagePath);
  if (signError || !signed) {
    console.error("signed upload url failed:", signError?.message);
    return jsonError("Couldn't start the upload. Please try again.", 500);
  }

  return NextResponse.json({
    qrCodeId,
    storagePath,
    signedUrl: signed.signedUrl,
    token: signed.token,
    fileName: sanitizeFileName(fileName),
  });
}

export async function GET(request: Request) {
  const config = serverSupabaseConfig();
  if (!config.configured) {
    return jsonError("Publishing isn't configured on this deployment.", 503, { missing: config.missing });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Sign in first.", 401);

  const assetId = new URL(request.url).searchParams.get("assetId");
  if (!assetId) return jsonError("Missing assetId.", 400);

  // RLS: select only returns the owner's asset.
  const { data: asset } = await supabase
    .from("qr_assets")
    .select("id, storage_path, file_name, file_size, mime_type")
    .eq("id", assetId)
    .maybeSingle();
  if (!asset) return jsonError("File not found.", 404);

  const { data: signed } = await supabase.storage
    .from("qr-private")
    .createSignedUrl(asset.storage_path, 3600);

  return NextResponse.json({
    assetId: asset.id,
    fileName: asset.file_name,
    fileSize: asset.file_size,
    mimeType: asset.mime_type,
    previewUrl: signed?.signedUrl ?? null,
  });
}

export async function DELETE(request: Request) {
  const config = serverSupabaseConfig();
  if (!config.configured) {
    return jsonError("Publishing isn't configured on this deployment.", 503, { missing: config.missing });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Sign in first.", 401);

  let body: { assetId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  if (!body.assetId) return jsonError("Missing assetId.", 400);

  const { data: asset } = await supabase
    .from("qr_assets")
    .select("id, storage_path")
    .eq("id", body.assetId)
    .maybeSingle();
  if (!asset) return jsonError("File not found.", 404);

  await supabase.storage.from("qr-private").remove([asset.storage_path]);
  const { error } = await supabase.from("qr_assets").delete().eq("id", asset.id);
  if (error) {
    console.error("asset delete failed:", error.code);
    return jsonError("Couldn't remove the file. Please try again.", 500);
  }
  return NextResponse.json({ ok: true });
}
