import { NextResponse } from "next/server";
import { serverSupabaseConfig } from "@/lib/qr/config";
import { requiresPublishing } from "@/lib/qr/payloads";
import { publicQrUrl } from "@/lib/qr/public-url";
import {
  collectAssetRefs,
  displayNameFor,
  extractLinkItems,
  extractSocialItems,
  sanitizeContentForStorage,
} from "@/lib/qr/publishing";
import { isQRType } from "@/lib/qr/registry";
import { generateSlug } from "@/lib/qr/slug";
import type { QRContent, QRDesignOptions } from "@/lib/qr/types";
import { contentSchemas } from "@/lib/qr/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * The publish authority. NEVER trusts the browser: content is
 * re-validated with the same Zod schemas, every referenced asset's
 * ownership is re-checked, and only then is the record published and
 * the real /q/[slug] URL minted. Re-publishing the same record keeps
 * its slug (idempotent — double-clicks can't mint duplicates).
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
  if (!user) return jsonError("Sign in to publish.", 401);

  let body: { qrCodeId?: string; type?: string; content?: unknown; design?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  if (!isQRType(body.type)) return jsonError("Unknown QR type.", 400);
  const type = body.type;

  // ── Server-side revalidation (the browser's validation is advisory) ──
  const parsed = contentSchemas[type].safeParse(
    (body.content as { data?: unknown } | undefined)?.data ?? body.content,
  );
  if (!parsed.success) {
    return jsonError("The content is incomplete or invalid.", 400, {
      issues: parsed.error.issues.slice(0, 10).map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const content = { type, data: parsed.data } as QRContent;
  if (!requiresPublishing(content)) {
    return jsonError("This QR type encodes its content directly — nothing to publish.", 400);
  }
  const design = (body.design ?? {}) as QRDesignOptions;

  // ── Ownership of every referenced asset ──
  const refs = collectAssetRefs(content);
  const assetIds = refs.map((r) => r.assetId);
  let assetRows: Array<{ id: string; storage_path: string; public_url: string | null; mime_type: string; file_name: string }> = [];
  if (assetIds.length > 0) {
    const { data } = await supabase
      .from("qr_assets")
      .select("id, storage_path, public_url, mime_type, file_name")
      .in("id", assetIds);
    assetRows = data ?? [];
    if (assetRows.length !== new Set(assetIds).size) {
      return jsonError("One of the uploaded files could not be found — upload it again.", 400);
    }
  }

  // ── Create or load the row (RLS scopes to owner) ──
  let qrCodeId = typeof body.qrCodeId === "string" ? body.qrCodeId : null;
  let existingSlug: string | null = null;
  if (qrCodeId) {
    const { data: row } = await supabase
      .from("qr_codes")
      .select("id, slug")
      .eq("id", qrCodeId)
      .maybeSingle();
    if (!row) return jsonError("QR code not found.", 404);
    existingSlug = row.slug;
  } else {
    const { data: row, error } = await supabase
      .from("qr_codes")
      .insert({ user_id: user.id, type, status: "draft" })
      .select("id")
      .single();
    if (error || !row) {
      console.error("qr insert failed:", error?.code);
      return jsonError("Couldn't publish. Please try again.", 500);
    }
    qrCodeId = row.id as string;
  }

  // Assets must belong to this QR record (prevents cross-record reuse of ids).
  if (assetIds.length > 0) {
    const { data: linked } = await supabase
      .from("qr_assets")
      .select("id")
      .in("id", assetIds)
      .eq("qr_code_id", qrCodeId);
    if ((linked ?? []).length !== new Set(assetIds).size) {
      return jsonError("One of the uploaded files belongs to a different QR code.", 400);
    }
  }

  // ── Copy assets to the public bucket (service role — the only writer) ──
  const admin = createAdminClient();
  for (const row of assetRows) {
    if (row.public_url) continue; // already published
    const ext = (row.file_name.match(/\.[a-z0-9]{1,10}$/i)?.[0] ?? "").toLowerCase();
    const publicPath = `q/${qrCodeId}/${row.id}${ext}`;
    const { error: copyError } = await admin.storage
      .from("qr-private")
      .copy(row.storage_path, publicPath, { destinationBucket: "qr-public" });
    if (copyError && !/exists/i.test(copyError.message)) {
      console.error("asset copy failed:", copyError.message);
      return jsonError("Publishing failed while preparing files. Please try again.", 500);
    }
    const { data: pub } = admin.storage.from("qr-public").getPublicUrl(publicPath);
    const { error: urlError } = await supabase
      .from("qr_assets")
      .update({ public_url: pub.publicUrl })
      .eq("id", row.id);
    if (urlError) {
      console.error("asset url update failed:", urlError.code);
      return jsonError("Publishing failed while preparing files. Please try again.", 500);
    }
  }

  // ── Relational items (replace) ──
  const linkItems = extractLinkItems(content);
  const socialItems = extractSocialItems(content);
  await supabase.from("qr_link_items").delete().eq("qr_code_id", qrCodeId);
  await supabase.from("qr_social_items").delete().eq("qr_code_id", qrCodeId);
  if (linkItems.length > 0) {
    const { error } = await supabase
      .from("qr_link_items")
      .insert(linkItems.map((item) => ({ ...item, qr_code_id: qrCodeId })));
    if (error) {
      console.error("link items insert failed:", error.code);
      return jsonError("Couldn't publish. Please try again.", 500);
    }
  }
  if (socialItems.length > 0) {
    const { error } = await supabase
      .from("qr_social_items")
      .insert(socialItems.map((item) => ({ ...item, qr_code_id: qrCodeId })));
    if (error) {
      console.error("social items insert failed:", error.code);
      return jsonError("Couldn't publish. Please try again.", 500);
    }
  }

  // ── Publish (existing slug is kept — republish never mints a new URL) ──
  const storedContent = sanitizeContentForStorage(content);
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = existingSlug ?? generateSlug();
    const { error } = await supabase
      .from("qr_codes")
      .update({
        type,
        name: displayNameFor(content) || null,
        slug,
        status: "published",
        content: storedContent,
        design,
        destination_url: publicQrUrl(slug),
        published_at: new Date().toISOString(),
      })
      .eq("id", qrCodeId);
    if (!error) {
      return NextResponse.json({ qrCodeId, slug, publicUrl: publicQrUrl(slug) });
    }
    if (error.code === "23505" && !existingSlug) continue; // slug collision → retry
    console.error("qr publish failed:", error.code);
    return jsonError("Couldn't publish. Please try again.", 500);
  }
  return jsonError("Couldn't publish. Please try again.", 500);
}
