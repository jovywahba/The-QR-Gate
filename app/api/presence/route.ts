import { NextResponse, type NextRequest } from "next/server";
import { serverSupabaseConfig } from "@/lib/qr/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Throttled presence heartbeat. The client pings this every ~75s while an
 * authenticated tab is open. We record ONLY an opaque per-tab id and a
 * coarse route category — never a raw IP, never a session token. The row
 * is keyed by user_id (upsert), so the table holds at most one row per
 * user and never grows unbounded. "Online" = last_seen within 5 minutes,
 * computed at read time in get_admin_overview.
 */
export const runtime = "nodejs";

const ROUTES = new Set(["Dashboard", "Generator", "Analytics", "Billing", "Settings", "Public Page"]);

export async function POST(request: NextRequest) {
  if (!serverSupabaseConfig().configured) return NextResponse.json({ ok: false }, { status: 204 });

  let body: { sessionHash?: unknown; route?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const sessionHash = typeof body.sessionHash === "string" ? body.sessionHash.slice(0, 64) : "";
  const route = typeof body.route === "string" && ROUTES.has(body.route) ? body.route : "Dashboard";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // touch_presence is a security-definer upsert scoped to auth.uid().
  await supabase.rpc("touch_presence", { p_session_hash: sessionHash, p_route_category: route });
  return NextResponse.json({ ok: true });
}
