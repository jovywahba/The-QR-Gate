import type { Metadata } from "next";
import { FileText, ShieldCheck } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { AdminSection, MigrationRequired } from "@/components/admin/admin-ui";
import { listExportJobs, type ExportJob } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

function when(v: string): string {
  const t = new Date(v);
  return Number.isNaN(t.getTime())
    ? "—"
    : t.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Inline status pill for an export job. Only the two states we can actually
 * distinguish are colored — complete (paid-green) and failed (destructive);
 * anything else (e.g. an in-flight "running") stays neutral rather than
 * pretending to be a success.
 */
function ExportStatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const style =
    s === "complete"
      ? "bg-[#1B8A5B]/10 text-[#1B8A5B]"
      : s === "failed"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        style,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status || "—"}
    </span>
  );
}

export default async function AdminReportsPage() {
  await requireAdmin("view_reports");
  const supabase = await createClient();
  const { available, rows } = await listExportJobs(supabase, 50);

  return (
    <>
      <AdminTopbar title="Reports" />
      <div className="flex flex-col gap-6 p-6">
        <AdminSection
          title="Available exports"
          description="What this platform can export today."
        >
          <ul className="flex flex-col divide-y">
            <li className="flex items-start justify-between gap-3 pb-3">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-4 flex-none text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm font-medium">Per-QR analytics CSV</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    From the owner dashboard: open a QR code and export its scan analytics as an
                    injection-safe CSV.
                  </p>
                </div>
              </div>
              <span className="mt-0.5 flex-none font-mono text-[11px] uppercase tracking-wide text-[#1B8A5B]">
                Live
              </span>
            </li>
            <li className="flex items-start justify-between gap-3 pt-3">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-4 flex-none text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm font-medium">Admin aggregate CSV export</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Portfolio-wide users / analytics / subscriptions export from this panel.
                  </p>
                </div>
              </div>
              <span className="mt-0.5 flex-none font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Not yet
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Admin aggregate CSV export — coming in a later phase.
          </p>
        </AdminSection>

        <AdminSection
          title="Weekly email reports"
          description="Scheduled email digests of platform activity."
        >
          <p className="text-sm font-medium">Weekly email reports are not configured</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No scheduled_reports table or cron is wired up yet.
          </p>
        </AdminSection>

        <AdminSection
          title="Previous admin exports"
          description="History of admin aggregate exports, newest first."
        >
          {!available ? (
            <MigrationRequired what="Export history" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin exports yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">When</th>
                    <th className="px-5 py-2.5 font-medium">Kind</th>
                    <th className="px-5 py-2.5 font-medium">Rows</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r: ExportJob) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-muted-foreground">
                        {when(r.createdAt)}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-xs">{r.kind || "—"}</td>
                      <td className="px-5 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                        {r.rowCount == null ? "—" : r.rowCount.toLocaleString()}
                      </td>
                      <td className="px-5 py-2.5">
                        <ExportStatusPill status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 flex-none" aria-hidden />
          <span>
            Every admin aggregate export is CSV-formula-injection safe, excludes raw IP/visitor
            identity, and writes an audit entry.
          </span>
        </p>
      </div>
    </>
  );
}
