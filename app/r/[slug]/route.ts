import { type NextRequest, NextResponse } from "next/server";
import { recordScan, resolveSlug } from "@/lib/analytics/record";
import { serverSupabaseConfig } from "@/lib/qr/config";
import { isValidSlug } from "@/lib/qr/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Tracked short link for direct-URL QR types. A scan of /r/[slug]
 * records the visit server-side (bots/prefetch/owner excluded), then
 * 302-redirects to the QR's stored destination — and ONLY that stored,
 * pre-validated URL, so this can never be turned into an open redirect.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function home(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug) || !serverSupabaseConfig().configured) return home(request);

  const admin = createAdminClient();
  const row = await resolveSlug(admin, slug);
  if (!row || row.status !== "published" || !row.destination_url) return home(request);
  if (!/^https?:\/\//i.test(row.destination_url)) return home(request);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await recordScan(admin, {
      qrCodeId: row.id,
      ownerId: row.user_id,
      viewerId: user?.id ?? null,
      headers: request.headers,
    });
  } catch {
    // Never block the redirect on analytics.
  }

  return NextResponse.redirect(row.destination_url, 302);
}
