import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/app/stat-card";
import { getAdminOverview } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

const ORDER = ["Dashboard", "Generator", "Analytics", "Billing", "Settings", "Public Page"] as const;

export default async function AdminOverviewPage() {
  await requireAdmin("view_overview");
  const supabase = await createClient();
  const o = await getAdminOverview(supabase);

  if (!o.available) {
    return (
      <>
        <AdminTopbar title="Overview" />
        <div className="p-6">
          <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
            Admin metrics aren&apos;t available yet. Apply{" "}
            <span className="font-mono text-xs">supabase/SUPABASE_PRODUCT_ADMIN_EXPANSION.sql</span>{" "}
            in the Supabase SQL Editor, then reload.
          </div>
        </div>
      </>
    );
  }

  const routeRows = ORDER.map((r) => [r, o.presenceByRoute[r] ?? 0] as const).filter(
    ([, n]) => n > 0,
  );

  return (
    <>
      <AdminTopbar title="Overview" />
      <div className="flex flex-col gap-6 p-6">
        {/* People */}
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            People
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Users" value={o.totalUsers.toLocaleString()} />
            <StatCard label="Online Now" value={o.onlineNow.toLocaleString()} />
            <StatCard label="Active Today" value={o.activeToday.toLocaleString()} />
            <StatCard label="New Users Today" value={o.newUsersToday.toLocaleString()} />
            <StatCard label="New This Month" value={o.newUsersMonth.toLocaleString()} />
            <StatCard label="Pro Accounts" value={o.proAccounts.toLocaleString()} />
            <StatCard
              label="Free Accounts"
              value={Math.max(0, o.totalUsers - o.proAccounts).toLocaleString()}
            />
          </div>
        </section>

        {/* QR + scans */}
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            QR codes &amp; scans
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total QR Codes" value={o.totalQr.toLocaleString()} />
            <StatCard label="Active QR Codes" value={o.activeQr.toLocaleString()} />
            <StatCard label="Paused QR Codes" value={o.pausedQr.toLocaleString()} />
            <StatCard label="Total Scans" value={o.totalScans.toLocaleString()} />
            <StatCard label="Scans Today" value={o.scansToday.toLocaleString()} />
            <StatCard label="Scans · 30 Days" value={o.scans30d.toLocaleString()} />
            <StatCard label="Bot Scans · 30 Days" value={o.botScans30d.toLocaleString()} />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Presence by route */}
          <div className="rounded-lg border bg-card lg:col-span-2">
            <div className="border-b p-5">
              <h2 className="text-sm font-semibold">Online now, by area</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Authenticated sessions seen in the last 5 minutes.
              </p>
            </div>
            <div className="p-5">
              {routeRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one is online right now.</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {routeRows.map(([route, count]) => (
                    <li key={route} className="flex items-center justify-between text-sm">
                      <span>{route}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Honest "not tracked" panel */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-5">
              <h2 className="text-sm font-semibold">Not tracked yet</h2>
            </div>
            <div className="flex flex-col gap-3 p-5 text-sm">
              <Unavailable label="Storage Usage" />
              <Unavailable label="Failed Publishes" />
              <p className="text-xs text-muted-foreground">
                These need dedicated instrumentation before they can be shown truthfully.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Unavailable({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-mono text-xs text-muted-foreground">Not tracked</span>
    </div>
  );
}
