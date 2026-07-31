import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { AdminSection, Breakdown, MigrationRequired, TrendBars } from "@/components/admin/admin-ui";
import { StatCard } from "@/components/app/stat-card";
import { getAdminAnalytics } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

const DAY_MS = 86_400_000;

type RangeKey = "today" | "7d" | "30d" | "90d" | "all" | "custom";

const RANGE_PILLS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

/**
 * Resolve the requested window into a concrete [from, to] pair. new Date()/
 * Date.now() are fine in app code — this is a live dashboard, not a workflow
 * script. Anything unrecognized falls back to the 7-day default; a malformed
 * custom range falls back to the last 30 days.
 */
function resolveRange(sp: { range?: string; from?: string; to?: string }): {
  key: RangeKey;
  from: Date;
  to: Date;
} {
  const now = new Date();
  const raw = sp.range;
  const key: RangeKey =
    raw === "today" ||
    raw === "7d" ||
    raw === "30d" ||
    raw === "90d" ||
    raw === "all" ||
    raw === "custom"
      ? raw
      : "7d";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const back = (days: number): Date => new Date(now.getTime() - days * DAY_MS);

  switch (key) {
    case "today":
      return { key, from: startOfToday, to: now };
    case "30d":
      return { key, from: back(30), to: now };
    case "90d":
      return { key, from: back(90), to: now };
    case "all":
      return { key, from: new Date("2020-01-01T00:00:00.000Z"), to: now };
    case "custom": {
      const f = sp.from ? new Date(sp.from) : null;
      const t = sp.to ? new Date(sp.to) : null;
      if (f && !Number.isNaN(f.getTime()) && t && !Number.isNaN(t.getTime())) {
        return { key, from: f, to: t };
      }
      return { key, from: back(30), to: now };
    }
    case "7d":
    default:
      return { key, from: back(7), to: now };
  }
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  await requireAdmin("view_analytics");
  const sp = await searchParams;
  const { key: rangeKey, from, to } = resolveRange(sp);

  const supabase = await createClient();
  const data = await getAdminAnalytics(supabase, from, to);

  const filterRow = (
    <div className="flex flex-wrap items-center gap-2">
      {RANGE_PILLS.map((r) => {
        const active = r.key === rangeKey;
        return (
          <Link
            key={r.key}
            href={`/admin/analytics?range=${r.key}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors",
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {r.label}
          </Link>
        );
      })}
      <span className="ml-auto font-mono text-[11px] text-muted-foreground">
        {fmtDate(from)} — {fmtDate(to)}
      </span>
    </div>
  );

  if (!data.available) {
    return (
      <>
        <AdminTopbar title="Analytics" />
        <div className="flex flex-col gap-6 p-6">
          {filterRow}
          <MigrationRequired what="System-wide analytics" />
        </div>
      </>
    );
  }

  const { signups, publishedFirstQr } = data.conversion;
  const conversionValue =
    signups > 0
      ? `${publishedFirstQr.toLocaleString()} of ${signups.toLocaleString()} (${Math.round(
          (publishedFirstQr / signups) * 100,
        )}%)`
      : "—";

  return (
    <>
      <AdminTopbar title="Analytics" />
      <div className="flex flex-col gap-6 p-6">
        {filterRow}

        {/* Headline counts — real aggregates only. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Human Scans" value={data.humanScans.toLocaleString()} />
          <StatCard label="Bot Scans" value={data.botScans.toLocaleString()} />
          <StatCard label="Signups" value={signups.toLocaleString()} />
          <StatCard label="Signup → First Publish" value={conversionValue} />
        </div>

        {/* Trends */}
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminSection title="Scans by day">
            <TrendBars data={data.scansByDay} />
          </AdminSection>
          <AdminSection title="Unique visitors by day">
            <TrendBars data={data.visitorsByDay} emptyLabel="No visitors in this range." />
          </AdminSection>
          <AdminSection title="Registrations by day">
            <TrendBars data={data.registrationsByDay} emptyLabel="No sign-ups in this range." />
          </AdminSection>
          <AdminSection title="QR creation by day">
            <TrendBars data={data.qrCreationByDay} emptyLabel="No QR codes created in this range." />
          </AdminSection>
        </div>

        {/* Breakdowns */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <AdminSection title="Countries">
            <Breakdown data={data.countries} emptyLabel="No location data yet." />
          </AdminSection>
          <AdminSection title="Devices">
            <Breakdown data={data.devices} />
          </AdminSection>
          <AdminSection title="Browsers">
            <Breakdown data={data.browsers} />
          </AdminSection>
          <AdminSection title="Operating systems">
            <Breakdown data={data.operatingSystems} />
          </AdminSection>
          <AdminSection title="Referrers">
            <Breakdown data={data.referrers} emptyLabel="No referrers recorded." />
          </AdminSection>
          <AdminSection title="QR type distribution">
            <Breakdown data={data.typeDistribution} />
          </AdminSection>
          <AdminSection title="Tracking mode">
            <Breakdown data={data.trackingDistribution} />
          </AdminSection>
        </div>

        {/* Top QR codes */}
        <AdminSection title="Top QR codes" description="Most-scanned codes in the selected range.">
          {data.topQrs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scans in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="hidden py-2 pr-4 font-medium sm:table-cell">Slug</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pl-4 text-right font-medium">Scans</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topQrs.map((q) => (
                    <tr key={q.id}>
                      <td className="max-w-52 truncate py-2 pr-4">
                        <Link href="/admin/qr-codes" className="text-accent hover:underline">
                          {q.name ?? "Untitled"}
                        </Link>
                      </td>
                      <td className="hidden max-w-40 truncate py-2 pr-4 font-mono text-xs text-muted-foreground sm:table-cell">
                        {q.slug ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{q.type || "—"}</td>
                      <td className="py-2 pl-4 text-right font-mono tabular-nums">
                        {q.scans.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>

        <p className="text-xs text-muted-foreground">
          Aggregate only — no raw IP or visitor identity is shown.
        </p>
      </div>
    </>
  );
}
