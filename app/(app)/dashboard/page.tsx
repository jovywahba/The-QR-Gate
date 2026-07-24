import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Plus,
  QrCode,
  Sparkles,
} from "lucide-react";
import { AppTopbar } from "@/components/app/app-topbar";
import { DashboardActivity } from "@/components/app/dashboard-activity";
import { DraftResumeBanner } from "@/components/app/draft-resume-banner";
import { QrThumb } from "@/components/app/qr-thumb";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchScanActivity, fetchScanOverview } from "@/lib/analytics/dashboard";
import { FREE_ACTIVE_LIMIT, PRO_PLAN_NAME, statusLabel } from "@/lib/billing/plan";
import { getPlanStatus } from "@/lib/billing/plan-server";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { scanDisplay, statusBadge } from "@/lib/qr/status-display";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { QRRowActions } from "./qr-codes/row-actions";

export const metadata: Metadata = { title: "Dashboard" };

const RANGE_DAYS: Record<string, number> = { "7": 7, "30": 30, "90": 90, all: 3650 };

type RecentRow = {
  id: string;
  name: string | null;
  type: string;
  status: string;
  slug: string | null;
  tracking_mode: string | null;
  destination_url: string | null;
  updated_at: string;
};
type Summary = { scans: number; unique: number; last: string | null };

function firstName(full: string | null | undefined, email: string | null | undefined): string | null {
  const base = (full ?? "").trim();
  if (base) return base.split(/\s+/)[0];
  // Fall back to the email local part only if it looks like a real name (no digits/dots).
  const local = (email ?? "").split("@")[0];
  if (local && /^[a-zA-Z]{2,}$/.test(local)) return local[0].toUpperCase() + local.slice(1);
  return null;
}

function prettyDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function destinationSummary(row: RecentRow): string {
  if (row.type === "wifi") return "Wi-Fi network";
  if (row.type === "vcard") return "Contact card";
  if (row.destination_url) return row.destination_url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return row.status === "published" ? "—" : "Not published yet";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const rangeKey = rangeParam && rangeParam in RANGE_DAYS ? rangeParam : "30";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, plan, overview, activity] = await Promise.all([
    user
      ? supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    getPlanStatus(supabase),
    fetchScanOverview(supabase),
    fetchScanActivity(supabase, RANGE_DAYS[rangeKey]),
  ]);

  const name = firstName(
    profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined),
    user?.email,
  );

  // Recent QR codes (5 most recently updated) + real scan summaries, merged
  // in one pass — no per-row query.
  const { data: recentRaw } = await supabase
    .from("qr_codes")
    .select("id, name, type, status, slug, tracking_mode, destination_url, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);
  const recent = (recentRaw ?? []) as RecentRow[];

  const summaries = new Map<string, Summary>();
  if (recent.length > 0) {
    const { data: summariesRaw } = await supabase.rpc("get_user_qr_summaries");
    for (const s of (summariesRaw ?? []) as Array<Record<string, unknown>>) {
      if (typeof s.id === "string") {
        summaries.set(s.id, {
          scans: typeof s.scans === "number" ? s.scans : 0,
          unique: typeof s.unique_scans === "number" ? s.unique_scans : 0,
          last: typeof s.last_scanned === "string" ? s.last_scanned : null,
        });
      }
    }
  }

  const uniqueValue = overview.uniqueVisitors === null ? "—" : overview.uniqueVisitors.toLocaleString();

  return (
    <>
      <AppTopbar title="Dashboard" />

      <div className="flex flex-col gap-6 p-6">
        {/* Welcome hero */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {name ? `Welcome back, ${name}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your QR codes and track their performance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/qr-codes">
                <QrCode aria-hidden />
                View all QR codes
              </Link>
            </Button>
            <Button asChild>
              <Link href="/create?new=1">
                <Plus aria-hidden />
                Create QR Code
              </Link>
            </Button>
          </div>
        </div>

        <DraftResumeBanner />

        {/* Overview cards — real data only */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active QR Codes" value={overview.activeCount.toLocaleString()} />
          <StatCard label="Total Scans" value={overview.totalScans.toLocaleString()} />
          <StatCard label="Unique Visitors" value={uniqueValue} />
          <StatCard label="Scans · Last 30 Days" value={overview.scans30d.toLocaleString()} />
        </div>

        {/* Activity + most scanned + plan */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardActivity
              activity={activity}
              rangeKey={rangeKey}
              hasAnyScans={overview.totalScans > 0}
            />
          </div>

          <div className="flex flex-col gap-4">
            <MostScannedCard overview={overview} />
            <PlanCard
              isUnlimited={plan.isUnlimited}
              status={plan.status}
              activeCount={plan.activeCount}
            />
          </div>
        </div>

        {/* Recent QR codes */}
        <Card>
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="text-sm font-semibold">Recent QR codes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/qr-codes">
                View all QR codes
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <QrCode className="size-7 text-muted-foreground/60" aria-hidden />
              <p className="text-sm text-muted-foreground">You haven&apos;t created any QR codes yet.</p>
              <Button size="sm" asChild>
                <Link href="/create?new=1">Create your first QR code</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {recent.map((row) => {
                const summary = summaries.get(row.id) ?? { scans: 0, unique: 0, last: null };
                const mode = row.tracking_mode ?? "hosted";
                const scan = scanDisplay(mode, summary.scans);
                const badge = statusBadge(row.status);
                const trackable = mode === "hosted" || mode === "redirect";
                const typeName = isQRType(row.type) ? getQRType(row.type).name : row.type;
                return (
                  <li key={row.id} className="flex items-center gap-3 p-4">
                    <QrThumb type={row.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{row.name || "Untitled QR"}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase",
                            badge.tone === "published" && "border-[#1B8A5B]/40 text-[#1B8A5B]",
                            badge.tone === "archived" && "text-muted-foreground",
                          )}
                        >
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {typeName} · {destinationSummary(row)}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <div
                        className={cn(
                          "font-mono text-sm tabular-nums",
                          scan.kind === "count" ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {scan.label}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {prettyDate(row.updated_at)}
                      </div>
                    </div>
                    <QRRowActions
                      qrCodeId={row.id}
                      name={row.name || "Untitled"}
                      status={row.status}
                      trackable={trackable}
                      publicUrl={row.status === "published" && mode === "hosted" ? row.destination_url : null}
                      copyUrl={row.status === "published" ? row.destination_url : null}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function MostScannedCard({
  overview,
}: {
  overview: Awaited<ReturnType<typeof fetchScanOverview>>;
}) {
  const top = overview.mostScanned;
  return (
    <Card className="flex flex-col">
      <div className="border-b p-5">
        <h2 className="text-sm font-semibold">Most scanned</h2>
      </div>
      <div className="flex-1 p-5">
        {top ? (
          <Link
            href={`/dashboard/qr-codes/${top.id}/analytics`}
            className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-3">
              <QrThumb type={top.type ?? "website"} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{top.name || "Untitled QR"}</div>
                {top.type && isQRType(top.type) ? (
                  <div className="text-xs text-muted-foreground">{getQRType(top.type).name}</div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
              <span className="text-foreground">{top.scans.toLocaleString()} scans</span>
              {top.unique !== null ? <span>{top.unique.toLocaleString()} unique</span> : null}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-accent">
              View analytics <ArrowUpRight className="size-3.5" aria-hidden />
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <BarChart3 className="size-6 text-muted-foreground/60" aria-hidden />
            <p className="text-xs text-muted-foreground">
              No scans yet. Share a QR code to see your top performer here.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function PlanCard({
  isUnlimited,
  status,
  activeCount,
}: {
  isUnlimited: boolean;
  status: string | null;
  activeCount: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Plan</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {isUnlimited ? PRO_PLAN_NAME : "Free"}
        </span>
      </div>
      <p className="mt-2 font-mono text-sm tabular-nums">
        {isUnlimited ? (
          <span className="text-muted-foreground">{statusLabel(status)} · unlimited QR codes</span>
        ) : (
          <>
            {activeCount} of {FREE_ACTIVE_LIMIT} <span className="text-muted-foreground">QR codes used</span>
          </>
        )}
      </p>
      {isUnlimited ? (
        <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
          <Link href="/dashboard/billing">
            <CreditCard aria-hidden />
            Manage billing
          </Link>
        </Button>
      ) : (
        <Button size="sm" className="mt-3 w-full" asChild>
          <Link href="/dashboard/billing">
            <Sparkles aria-hidden />
            Upgrade to Pro
          </Link>
        </Button>
      )}
    </Card>
  );
}
