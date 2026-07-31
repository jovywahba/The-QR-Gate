import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { AdminSection, MigrationRequired, NotTrackedRow } from "@/components/admin/admin-ui";
import { listSecurityEvents } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Security Center" };

function when(v: string): string {
  return new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function humanize(v: string): string {
  return v.replace(/_/g, " ");
}

/**
 * Severity pill. Deliberately NOT StatusPill (that is for operational health):
 * critical → destructive, warning → the amber signal color, everything else
 * (info / unknown strings) → muted.
 */
function severityClass(severity: string): string {
  if (severity === "critical") return "bg-destructive/10 text-destructive";
  if (severity === "warning") return "bg-[#D9A21B]/10 text-[#D9A21B]";
  return "bg-muted text-muted-foreground";
}

/** Signals the current stack genuinely cannot observe — never faked as alerts. */
const NOT_TRACKED: { label: string; hint?: string }[] = [
  { label: "Repeated failed login attempts", hint: "GoTrue does not expose these" },
  { label: "Password brute-force" },
  { label: "CSV abuse attempts" },
  { label: "Slug collision / hijack attempts" },
  { label: "API rate-limit violations" },
  { label: "Branded-domain verification failures" },
  { label: "Unusual scan spikes" },
];

export default async function AdminSecurityPage() {
  await requireAdmin("view_security");
  const supabase = await createClient();
  const { available, rows } = await listSecurityEvents(supabase, { limit: 150 });

  return (
    <>
      <AdminTopbar title="Security Center" />
      <div className="flex flex-col gap-6 p-6">
        {!available ? (
          <MigrationRequired what="Security events" />
        ) : (
          <AdminSection
            title="Recent security events"
            description="Privileged-action denials, invalid webhook signatures, and suspended-account access attempts recorded by the platform."
          >
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No security events recorded yet.</p>
            ) : (
              <div className="-mx-5 -mb-5 overflow-x-auto border-t">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-2.5 font-medium">Event</th>
                      <th className="px-5 py-2.5 font-medium">Severity</th>
                      <th className="hidden px-5 py-2.5 font-medium md:table-cell">Subject</th>
                      <th className="px-5 py-2.5 text-right font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-2.5 font-mono text-xs">{humanize(r.eventType)}</td>
                        <td className="px-5 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
                              severityClass(r.severity),
                            )}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td className="hidden max-w-56 truncate px-5 py-2.5 font-mono text-xs text-muted-foreground md:table-cell">
                          {r.subject ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-2.5 text-right font-mono text-xs text-muted-foreground">
                          {when(r.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminSection>
        )}

        <AdminSection
          title="Signals not tracked yet"
          description="Genuinely not recorded by the current stack — shown as “Not tracked” rather than a fabricated alert."
        >
          <div className="divide-y">
            {NOT_TRACKED.map((sig) => (
              <NotTrackedRow key={sig.label} label={sig.label} hint={sig.hint} />
            ))}
          </div>
        </AdminSection>

        <p className="text-xs text-muted-foreground">
          Only signals the platform can genuinely observe are shown. Others read “Not tracked” until
          instrumented — never a fabricated alert.
        </p>
      </div>
    </>
  );
}
