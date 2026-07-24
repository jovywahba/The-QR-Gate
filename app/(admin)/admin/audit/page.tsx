import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { getAuditLog } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Audit Log" };

function when(v: string): string {
  return new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminAuditPage() {
  await requireAdmin("view_audit");
  const supabase = await createClient();
  const { available, rows } = await getAuditLog(supabase, { limit: 150 });

  return (
    <>
      <AdminTopbar title="Audit Log" />
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Append-only record of every privileged admin action. Normal admins cannot edit or delete
          these entries.
        </p>
        {!available ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
            Apply the admin migration to enable the audit log.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No admin actions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">When</th>
                  <th className="px-5 py-2.5 font-medium">Admin</th>
                  <th className="px-5 py-2.5 font-medium">Action</th>
                  <th className="hidden px-5 py-2.5 font-medium md:table-cell">Target</th>
                  <th className="hidden px-5 py-2.5 font-medium lg:table-cell">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-muted-foreground">
                      {when(r.createdAt)}
                    </td>
                    <td className="max-w-40 truncate px-5 py-2.5 text-xs">{r.adminEmail ?? r.adminUserId.slice(0, 8)}</td>
                    <td className="px-5 py-2.5 font-mono text-xs">{r.action}</td>
                    <td className="hidden max-w-40 truncate px-5 py-2.5 font-mono text-xs text-muted-foreground md:table-cell">
                      {r.targetType ? `${r.targetType}:${(r.targetId ?? "").slice(0, 8)}` : "—"}
                    </td>
                    <td className="hidden max-w-56 truncate px-5 py-2.5 text-xs text-muted-foreground lg:table-cell">
                      {r.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
