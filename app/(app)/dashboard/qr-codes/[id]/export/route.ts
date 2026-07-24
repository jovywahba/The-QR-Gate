import { type NextRequest, NextResponse } from "next/server";
import { toCsv, csvFilename } from "@/lib/export/csv";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { createClient } from "@/lib/supabase/server";

/**
 * Owner-scoped analytics CSV export for a single QR. Uses the caller's
 * session — RLS guarantees the QR (and its scan events) belong to them.
 * Cells are formula-injection-safe. We export only coarse, non-identifying
 * signals: never a raw IP, never the visitor hash, never private content.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ROWS = 50_000;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Sign in first.", { status: 401 });

  // RLS: returns the row only if the caller owns it.
  const { data: qr } = await supabase.from("qr_codes").select("id, name, type").eq("id", id).maybeSingle();
  if (!qr) return new NextResponse("Not found", { status: 404 });

  const { data: events } = await supabase
    .from("qr_scan_events")
    .select("scanned_at, country, region, city, device_type, browser, operating_system, referrer, is_bot")
    .eq("qr_code_id", id)
    .order("scanned_at", { ascending: false })
    .limit(MAX_ROWS);

  const name = qr.name || "Untitled";
  const typeName = isQRType(qr.type) ? getQRType(qr.type).name : qr.type;

  const header = [
    "Scanned At (UTC)", "QR Name", "QR Type", "Country", "Region", "City",
    "Device", "Browser", "Operating System", "Referrer", "Bot",
  ];
  const rows = (events ?? []).map((e) => [
    e.scanned_at,
    name,
    typeName,
    e.country ?? "",
    e.region ?? "",
    e.city ?? "",
    e.device_type ?? "",
    e.browser ?? "",
    e.operating_system ?? "",
    e.referrer ?? "",
    e.is_bot ? "bot" : "human",
  ]);

  const csv = toCsv([header, ...rows]);
  const filename = csvFilename(`${name}-analytics`, new Date().toISOString().slice(0, 10));

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
