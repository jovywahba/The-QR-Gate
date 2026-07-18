import { NextResponse } from "next/server";
import { parsePlanStatus } from "@/lib/billing/plan";
import { serverSupabaseConfig } from "@/lib/qr/config";
import { buildPayload } from "@/lib/qr/payloads";
import { publicQrUrl, trackedRedirectUrl } from "@/lib/qr/public-url";
import {
  collectAssetRefs,
  displayNameFor,
  extractLinkItems,
  extractSocialItems,
  redactContentForStorage,
} from "@/lib/qr/publishing";
import { isQRType } from "@/lib/qr/registry";
import { generateSlug } from "@/lib/qr/slug";
import { resolveTrackingMode, type TrackingMode } from "@/lib/qr/tracking";
import type { QRContent, QRDesignOptions } from "@/lib/qr/types";
import { contentSchemas } from "@/lib/qr/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * The commit authority — where EVERY QR is finalized into the user's
 * account at Step 4. NEVER trusts the browser: content is re-validated
 * with the same Zod schemas, asset ownership is re-checked, and the
 * free-plan quota is enforced ATOMICALLY server-side
 * (public.try_activate_qr, per-user advisory lock) so two concurrent
 * requests can't slip a free account past the limit.
 *
 * Encoding by tracking mode:
 *   hosted   → /q/[slug] (assets copied to the public bucket)
 *   redirect → /r/[slug] → 302 to the external URL (opt-in tracking)
 *   direct   → the external URL itself (no tracking)
 *   native   → nothing hosted; WiFi/vCard payload; password redacted
 *
 * Re-committing an already-published row keeps its slug (idempotent —
 * double-clicks never mint duplicate URLs or consume a second slot).
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
  if (!user) return jsonError("Sign in to continue.", 401);

  let body: {
    qrCodeId?: string;
    type?: string;
    content?: unknown;
    design?: unknown;
    trackingEnabled?: boolean;
  };
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
  const design = (body.design ?? {}) as QRDesignOptions;

  const mode: TrackingMode = resolveTrackingMode(content, body.trackingEnabled === true);
  const isHosted = mode === "hosted";

  // ── Plan snapshot for the fast pre-check (the atomic gate is below) ──
  const { data: planRaw } = await supabase.rpc("get_user_plan_status");
  const plan = parsePlanStatus(planRaw);

  // ── Load the existing row (RLS scopes to owner) or plan to create one ──
  let qrCodeId = typeof body.qrCodeId === "string" ? body.qrCodeId : null;
  let existingSlug: string | null = null;
  let wasPublished = false;
  if (qrCodeId) {
    const { data: row } = await supabase
      .from("qr_codes")
      .select("id, slug, status")
      .eq("id", qrCodeId)
      .maybeSingle();
    if (!row) return jsonError("QR code not found.", 404);
    existingSlug = row.slug;
    wasPublished = row.status === "published";
  }

  // Fast paywall: a NEW active QR when the free quota is already used.
  if (!wasPublished && !plan.canCreate) {
    return jsonError("You've used all 3 free QR codes.", 402, {
      code: "quota_exceeded",
      activeCount: plan.activeCount,
      limit: plan.limit ?? 3,
    });
  }

  // Create the draft row now if this is a brand-new QR.
  if (!qrCodeId) {
    const { data: row, error } = await supabase
      .from("qr_codes")
      .insert({ user_id: user.id, type, status: "draft" })
      .select("id")
      .single();
    if (error || !row) {
      console.error("qr insert failed:", error?.code);
      return jsonError("Couldn't save your QR. Please try again.", 500);
    }
    qrCodeId = row.id as string;
  }

  // ── Hosted only: verify + copy assets to the public bucket ──
  if (isHosted) {
    const refs = collectAssetRefs(content);
    const assetIds = refs.map((r) => r.assetId);
    if (assetIds.length > 0) {
      const { data: owned } = await supabase
        .from("qr_assets")
        .select("id, storage_path, public_url, file_name")
        .in("id", assetIds)
        .eq("qr_code_id", qrCodeId);
      const rows = owned ?? [];
      if (rows.length !== new Set(assetIds).size) {
        return jsonError("One of the uploaded files belongs to a different QR code.", 400);
      }
      const admin = createAdminClient();
      for (const row of rows) {
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
    }

    // Relational items (replace) — hosted list/social pages.
    const linkItems = extractLinkItems(content);
    const socialItems = extractSocialItems(content);
    await supabase.from("qr_link_items").delete().eq("qr_code_id", qrCodeId);
    await supabase.from("qr_social_items").delete().eq("qr_code_id", qrCodeId);
    if (linkItems.length > 0) {
      const { error } = await supabase
        .from("qr_link_items")
        .insert(linkItems.map((item) => ({ ...item, qr_code_id: qrCodeId })));
      if (error) return jsonError("Couldn't save your QR. Please try again.", 500);
    }
    if (socialItems.length > 0) {
      const { error } = await supabase
        .from("qr_social_items")
        .insert(socialItems.map((item) => ({ ...item, qr_code_id: qrCodeId })));
      if (error) return jsonError("Couldn't save your QR. Please try again.", 500);
    }
  }

  // ── Compute the encoded destination + slug for this mode ──
  const needsSlug = mode === "hosted" || mode === "redirect";
  const externalTarget = buildPayload(content); // "" for hosted types
  const storedContent = redactContentForStorage(content);

  async function writeAndActivate(slug: string | null): Promise<
    | { ok: true; slug: string | null }
    | { ok: false; response: NextResponse }
  > {
    const destinationUrl =
      mode === "hosted"
        ? slug
          ? publicQrUrl(slug)
          : null
        : mode === "redirect" || mode === "direct"
          ? externalTarget || null
          : null; // native → no server-side destination

    const basePayload = {
      type,
      name: displayNameFor(content) || null,
      slug,
      content: storedContent,
      design,
      destination_url: destinationUrl,
    };
    let { error: updateError } = await supabase
      .from("qr_codes")
      .update({ ...basePayload, tracking_mode: mode })
      .eq("id", qrCodeId!);
    // tracking_mode column absent → migration 0002 not applied yet; store the rest.
    if (
      updateError &&
      (updateError.code === "42703" ||
        updateError.code === "PGRST204" ||
        /tracking_mode/i.test(updateError.message ?? ""))
    ) {
      console.warn("tracking_mode column missing — apply migration 0002.");
      ({ error: updateError } = await supabase.from("qr_codes").update(basePayload).eq("id", qrCodeId!));
    }
    if (updateError) {
      if (updateError.code === "23505") return { ok: false, response: jsonError("__slug_collision__", 409) };
      console.error("qr update failed:", updateError.code);
      return { ok: false, response: jsonError("Couldn't save your QR. Please try again.", 500) };
    }

    // Atomic quota gate + activation (per-user advisory lock).
    const { data: activation, error: rpcError } = await supabase.rpc("try_activate_qr", {
      p_qr_id: qrCodeId,
    });
    if (rpcError) {
      // Migration 0002 not applied yet → degrade to a direct activation so
      // publishing keeps working (quota gate resumes once the SQL is applied).
      const missingFn =
        rpcError.code === "PGRST202" ||
        /could not find the function|function .* does not exist/i.test(rpcError.message ?? "");
      if (missingFn) {
        console.warn("try_activate_qr missing — apply migration 0002. Falling back without quota gate.");
        const { error: actErr } = await supabase
          .from("qr_codes")
          .update(wasPublished ? { status: "published" } : { status: "published", published_at: new Date().toISOString() })
          .eq("id", qrCodeId!);
        if (actErr) return { ok: false, response: jsonError("Couldn't save your QR. Please try again.", 500) };
        return { ok: true, slug };
      }
      console.error("try_activate_qr failed:", rpcError.code);
      return { ok: false, response: jsonError("Couldn't save your QR. Please try again.", 500) };
    }
    const result = (activation ?? {}) as { allowed?: boolean; reason?: string; active_count?: number; limit?: number };
    if (!result.allowed) {
      if (result.reason === "quota_exceeded") {
        return {
          ok: false,
          response: jsonError("You've used all 3 free QR codes.", 402, {
            code: "quota_exceeded",
            activeCount: result.active_count ?? plan.activeCount,
            limit: result.limit ?? 3,
          }),
        };
      }
      return { ok: false, response: jsonError("Couldn't save your QR. Please try again.", 400) };
    }
    return { ok: true, slug };
  }

  // ── Write + activate (retry once on a fresh-slug collision) ──
  let finalSlug: string | null = null;
  if (!needsSlug) {
    const out = await writeAndActivate(null);
    if (!out.ok) return out.response;
    finalSlug = null;
  } else {
    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      const slug = existingSlug ?? generateSlug();
      const out = await writeAndActivate(slug);
      if (out.ok) {
        finalSlug = slug;
        done = true;
      } else if (out.response.status === 409 && !existingSlug) {
        continue; // slug collision on a fresh slug → retry
      } else {
        return out.response;
      }
    }
    if (!done) return jsonError("Couldn't save your QR. Please try again.", 500);
  }

  const publicUrl =
    mode === "hosted" && finalSlug
      ? publicQrUrl(finalSlug)
      : mode === "redirect" && finalSlug
        ? trackedRedirectUrl(finalSlug)
        : null;

  return NextResponse.json({ qrCodeId, slug: finalSlug, publicUrl, trackingMode: mode });
}
