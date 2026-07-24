import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, RefreshCw } from "lucide-react";
import { DailyBars } from "@/components/app/analytics-charts";
import { Button } from "@/components/ui/button";
import type { ScanActivity } from "@/lib/analytics/dashboard";

/**
 * Account-wide scan-activity chart for the dashboard home. Every bar is
 * a real aggregated count from get_user_scan_activity(); when there's no
 * data — or the analytics SQL isn't applied yet — it shows an honest
 * state instead of a fabricated graph.
 */

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "all", label: "All time" },
] as const;

export function DashboardActivity({
  activity,
  rangeKey,
  hasAnyScans,
}: {
  activity: ScanActivity;
  rangeKey: string;
  /** True when the account has scans in ANY window (from the overview). */
  hasAnyScans: boolean;
}) {
  const rangeLabel = RANGES.find((r) => r.key === rangeKey)?.label ?? "30 days";

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <h2 className="text-sm font-semibold">Scan activity</h2>
          {activity.available && activity.total > 0 ? (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {activity.total.toLocaleString()} scans · {activity.unique.toLocaleString()} unique
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Chart date range">
          {RANGES.map((r) => (
            <Button key={r.key} variant={r.key === rangeKey ? "secondary" : "ghost"} size="sm" asChild>
              <Link href={`/dashboard?range=${r.key}`} scroll={false} aria-current={r.key === rangeKey}>
                {r.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {!activity.available ? (
          hasAnyScans ? (
            <EmptyState
              icon={<RefreshCw className="size-7 text-muted-foreground/60" aria-hidden />}
              title="Daily activity is warming up"
              body="Your scan totals are live above. The daily chart needs the latest analytics update applied to the database."
            />
          ) : (
            <NoScans />
          )
        ) : activity.total === 0 ? (
          hasAnyScans ? (
            <EmptyState
              icon={<BarChart3 className="size-7 text-muted-foreground/60" aria-hidden />}
              title={`No scans in the last ${rangeLabel.toLowerCase()}`}
              body="Try a wider range to see earlier activity."
            />
          ) : (
            <NoScans />
          )
        ) : (
          <DailyBars data={activity.daily.map((d) => ({ date: d.date, count: d.count }))} />
        )}
      </div>
    </div>
  );
}

function NoScans() {
  return (
    <EmptyState
      icon={<BarChart3 className="size-7 text-muted-foreground/60" aria-hidden />}
      title="No scans yet"
      body="Share one of your QR codes to start collecting analytics."
    />
  );
}

function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      {icon}
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
