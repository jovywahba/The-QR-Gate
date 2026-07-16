import { NextResponse } from "next/server";
import { serverSupabaseConfig } from "@/lib/qr/config";
import {
  checkMagicBytes,
  checkUploadMetadata,
  isAssetType,
  isOwnedStoragePath,
  sanitizeFileName,
} from "@/lib/qr/uploads";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Upload step 2 — after the browser finished uploading to the signed
 * URL, re-verify the STORED object (size from storage metadata, magic
 * bytes from a ranged read — the browser's word is never the
 * authority), then create the qr_assets row and return a preview URL.
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
    qrCodeId?: string;
    storagePath?: string;
    assetType?: string;
    fileName?: string;
    mimeType?: string;
    sortOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const { qrCodeId, storagePath } = body;
  if (!qrCodeId || !storagePath) return jsonError("Invalid request.", 400);
  if (!isAssetType(body.assetType)) return jsonError("Unknown asset type.", 400);
  // Never accept arbitrary storage paths — must match {userId}/{qrId}/{uuid}-{name}.
  if (!isOwnedStoragePath(storagePath, user.id, qrCodeId)) {
    return jsonError("Invalid storage path.", 400);
  }

  const { data: qrRow } = await supabase.from("qr_codes").select("id").eq("id", qrCodeId).maybeSingle();
  if (!qrRow) return jsonError("QR code not found.", 404);

  // ── Verify the stored object (admin: metadata + first bytes only) ──
  const admin = createAdminClient();
  const folder = storagePath.split("/").slice(0, 2).join("/");
  const objectName = storagePath.split("/")[2];
  const { data: listed, error: listError } = await admin.storage
    .from("qr-private")
    .list(folder, { search: objectName.slice(0, 36) });
  const object = listed?.find((o) => o.name === objectName);
  if (listError || !object) return jsonError("Upload not found — please try again.", 400);

  const actualSize = (object.metadata as { size?: number } | null)?.size ?? 0;
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const fileName = sanitizeFileName(typeof body.fileName === "string" ? body.fileName : objectName);
  const metaCheck = checkUploadMetadata({
    assetType: body.assetType,
    fileName,
    fileSize: actualSize,
    mimeType,
  });
  if (!metaCheck.ok) {
    await admin.storage.from("qr-private").remove([storagePath]);
    return jsonError(metaCheck.error, 400);
  }

  // Ranged read of the head — enough for magic bytes, cheap for 200 MB videos.
  const headResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/qr-private/${storagePath}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Range: "bytes=0-31",
      },
    },
  );
  if (!headResponse.ok) {
    return jsonError("Couldn't verify the upload. Please try again.", 500);
  }
  const head = new Uint8Array(await headResponse.arrayBuffer());
  const byteCheck = checkMagicBytes(body.assetType, head);
  if (!byteCheck.ok) {
    await admin.storage.from("qr-private").remove([storagePath]);
    return jsonError(byteCheck.error, 400);
  }

  // ── Create the asset row (user-scoped → RLS enforces ownership) ──
  const { data: asset, error: insertError } = await supabase
    .from("qr_assets")
    .insert({
      qr_code_id: qrCodeId,
      user_id: user.id,
      asset_type: body.assetType,
      storage_path: storagePath,
      mime_type: mimeType,
      file_name: fileName,
      file_size: actualSize,
      sort_order: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    })
    .select("id")
    .single();
  if (insertError || !asset) {
    console.error("asset insert failed:", insertError?.code);
    return jsonError("Couldn't save the upload. Please try again.", 500);
  }

  const { data: signed } = await supabase.storage.from("qr-private").createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    assetId: asset.id,
    qrCodeId,
    fileName,
    fileSize: actualSize,
    mimeType,
    previewUrl: signed?.signedUrl ?? null,
  });
}
