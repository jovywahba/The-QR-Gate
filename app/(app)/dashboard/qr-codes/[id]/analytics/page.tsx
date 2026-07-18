import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, ExternalLink } from "lucide-react";
import { AppTopbar } from "@/components/app/app-topbar";
import { Breakdown, DailyBars, type Point, type Slice } from "@/components/app/analytics-charts";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: 3650 },
] as const;

type Summary = {
  authorized: boolean;
  total: number;
  unique: number;
  today: number;
  last_7d: number;
  last_30d: number;
  last_scanned: string | null;
  daily: Point[];
  countries: Slice[];
  devices: Slice[];
  browsers: Slice[];
  referrers: Slice[];
};

function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}
function slices(v: unknown): Slice[] {
  return Array.isArray(v)
    ? (v as Array<Record<string, unknown>>).map((s) => ({
        key: typeof s.key === "string" ? s.key : "Unknown",
        count: num(s.count),
      }))
    : [];
}

function parseSummary(raw: unknown): Summary {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    authorized: Boolean(r.authorized),
    total: num(r.total),
    unique: num(r.unique),
    today: num(r.today),
    last_7d: num(r.last_7d),
    last_30d: num(r.last_30d),
    last_scanned: typeof r.last_scanned === "string" ? r.last_scanned : null,
    daily: Array.isArray(r.daily)
      ? (r.daily as Array<Record<string, unknown>>).map((d) => ({
          date: typeof d.date === "string" ? d.date : "",
          count: num(d.count),
        }))
      : [],
    countries: slices(r.countries),
    devices: slices(r.devices),
    browsers: slices(r.browsers),
    referrers: slices(r.referrers),
  };
}

function formatDateTime(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const { range: rangeParam } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const range = RANGES.find((r) => r.key === rangeParam) ?? RANGES[1];

  const supabase = await createClient();
  // RLS: this only returns the row if the caller owns it.
  const { data: row } = await supabase
    .from("qr_codes")
    .select("id, name, type, status, tracking_mode, destination_url")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  const { data: summaryRaw } = await supabase.rpc("get_qr_scan_summary", { p_qr_id: id, p_days: range.days });
  const summary = parseSummary(summaryRaw);
  if (!summary.authorized) notFound();

  const typeName = isQRType(row.type) ? getQRType(row.type).name : row.type;
  const publicUrl = row.tracking_mode === "hosted" ? row.destination_url : null;

  return (
    <>
      <AppTopbar title="Analytics">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/qr-codes">
            <ArrowLeft aria-hidden />
            Back
          </Link>
        </Button>
      </AppTopbar>

      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{row.name || "Untitled QR"}</h2>
            <p className="text-sm text-muted-foreground">
              {typeName}
              {publicUrl ? (
                <>
                  {" · "}
                  <a href={publicUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    Public page <ExternalLink className="inline size-3" aria-hidden />
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <Button key={r.key} variant={r.key === range.key ? "secondary" : "ghost"} size="sm" asChild>
                <Link href={`/dashboard/qr-codes/${id}/analytics?range=${r.key}`}>{r.label}</Link>
              </Button>
            ))}
          </div>
        </div>

        {summary.total === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-12 text-center">
            <BarChart3 className="size-8 text-muted-foreground/60" aria-hidden />
            <p className="text-sm text-muted-foreground">
              No scans yet. Share your QR code to start collecting analytics.
            </p>
            {publicUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  Open public page
                </a>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Scans" value={summary.total.toLocaleString()} />
              <StatCard label="Unique Visitors" value={summary.unique.toLocaleString()} />
              <StatCard label="Today" value={summary.today.toLocaleString()} />
              <StatCard label="Last 7 Days" value={summary.last_7d.toLocaleString()} />
            </div>

            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b p-5">
                <h3 className="text-sm font-semibold">Scans · {range.label}</h3>
                <span className="font-mono text-xs text-muted-foreground">
                  Last scan: {formatDateTime(summary.last_scanned)}
                </span>
              </div>
              <div className="p-5">
                <DailyBars data={summary.daily} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Breakdown title="Countries" data={summary.countries} />
              <Breakdown title="Devices" data={summary.devices} />
              <Breakdown title="Browsers" data={summary.browsers} />
              <Breakdown title="Referrers" data={summary.referrers} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
