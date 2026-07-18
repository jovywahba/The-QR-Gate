import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BarChart3, CreditCard, Plus, QrCode, Sparkles } from "lucide-react";
import { AppTopbar } from "@/components/app/app-topbar";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FREE_ACTIVE_LIMIT, PRO_PLAN_NAME, statusLabel } from "@/lib/billing/plan";
import { getPlanStatus } from "@/lib/billing/plan-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

type Overview = {
  total_scans: number;
  scans_30d: number;
  active_count: number;
  most_scanned: { id: string; name: string | null; scans: number } | null;
};

function parseOverview(raw: unknown): Overview {
  const r = (raw ?? {}) as Record<string, unknown>;
  const most = r.most_scanned as Record<string, unknown> | null | undefined;
  return {
    total_scans: typeof r.total_scans === "number" ? r.total_scans : 0,
    scans_30d: typeof r.scans_30d === "number" ? r.scans_30d : 0,
    active_count: typeof r.active_count === "number" ? r.active_count : 0,
    most_scanned:
      most && typeof most.id === "string"
        ? { id: most.id, name: (most.name as string | null) ?? null, scans: (most.scans as number) ?? 0 }
        : null,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const plan = await getPlanStatus(supabase);
  const { data: overviewRaw } = await supabase.rpc("get_user_scan_overview");
  const overview = parseOverview(overviewRaw);

  const planValue = plan.isUnlimited
    ? PRO_PLAN_NAME
    : `Free — ${plan.activeCount} of ${FREE_ACTIVE_LIMIT}`;

  return (
    <>
      <AppTopbar title="Dashboard">
        <Button size="sm" asChild>
          <Link href="/">
            <Plus aria-hidden />
            Create QR
          </Link>
        </Button>
      </AppTopbar>

      <div className="flex flex-col gap-6 p-6">
        {/* Overview cards — real data only */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active QR Codes" value={String(overview.active_count)} />
          <StatCard label="Plan" value={planValue} />
          <StatCard label="Total Scans" value={overview.total_scans.toLocaleString()} />
          <StatCard label="Last 30 Days" value={overview.scans_30d.toLocaleString()} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Most scanned */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-sm font-semibold">Most scanned</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/qr-codes">
                  All QR codes
                  <ArrowUpRight aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="p-5">
              {overview.most_scanned ? (
                <Link
                  href={`/dashboard/qr-codes/${overview.most_scanned.id}/analytics`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                      <QrCode className="size-4" aria-hidden />
                    </span>
                    <span className="truncate text-sm font-medium">
                      {overview.most_scanned.name || "Untitled QR"}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-sm tabular-nums">
                    {overview.most_scanned.scans.toLocaleString()} scans
                  </span>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <BarChart3 className="size-7 text-muted-foreground/60" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    No scans yet. Share a QR code to start collecting analytics.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/">Create your first QR code</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Plan + quick actions */}
          <Card className="flex flex-col">
            <div className="border-b p-5">
              <h2 className="text-sm font-semibold">Your plan</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {plan.isUnlimited
                  ? `${PRO_PLAN_NAME} · ${statusLabel(plan.status)}`
                  : `Free · ${plan.activeCount} of ${FREE_ACTIVE_LIMIT} used`}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/qr-codes">
                  <QrCode aria-hidden />
                  View all QR codes
                </Link>
              </Button>
              {!plan.isUnlimited && (
                <Button className="justify-start" asChild>
                  <Link href="/dashboard/billing">
                    <Sparkles aria-hidden />
                    Upgrade to Pro
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/billing">
                  <CreditCard aria-hidden />
                  {plan.isUnlimited ? "Manage billing" : "Billing"}
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
