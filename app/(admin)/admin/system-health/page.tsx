import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { AdminSection, NotTrackedRow, StatusPill } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/admin/guard";
import { runHealth, STATUS_LABEL } from "@/lib/health/probe";

export const metadata: Metadata = { title: "System Health" };

function when(v: string): string {
  return new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminSystemHealthPage() {
  await requireAdmin("view_system_health");
  const report = await runHealth();

  return (
    <>
      <AdminTopbar title="System Health" />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-5">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Overall status
            </span>
            <StatusPill status={report.status} label={STATUS_LABEL[report.status]} />
          </div>
          <span className="font-mono text-xs text-muted-foreground">Checked {when(report.generatedAt)}</span>
        </div>

        <AdminSection
          title="Services"
          description="Live probe of each dependency. Reflects only the state the probe actually observed."
        >
          <ul className="divide-y">
            {report.checks.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="text-sm">{c.label}</span>
                <StatusPill status={c.status} label={STATUS_LABEL[c.status]} />
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection
          title="Not independently probed yet"
          description="The probe only reports configuration presence for these signals — not their live delivery."
        >
          <div className="divide-y">
            <NotTrackedRow label="Webhook delivery success rate" />
            <NotTrackedRow label="Cron / scheduled jobs execution" />
            <NotTrackedRow label="Branded-domain verification" />
          </div>
        </AdminSection>

        <p className="text-xs text-muted-foreground">
          Safe checks only — no keys, connection strings, or stack traces are shown.
        </p>
      </div>
    </>
  );
}
