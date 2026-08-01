import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { MigrationRequired } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryAuditLog } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Audit Log" };

const PAGE_SIZE = 50;
const TARGET_TYPES = ["", "user", "qr_code", "export"] as const;

function when(v: string): string {
  return new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** ISO from a yyyy-mm-dd date input (or null). `to` is pushed to end-of-day. */
function isoFrom(v: string | undefined, endOfDay = false): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; target?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireAdmin("view_audit");
  const sp = await searchParams;
  const action = (sp.action ?? "").trim();
  const target = TARGET_TYPES.includes(sp.target as (typeof TARGET_TYPES)[number]) ? sp.target : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { available, total, rows } = await queryAuditLog(supabase, {
    action: action || null,
    targetType: target || null,
    from: isoFrom(sp.from),
    to: isoFrom(sp.to, true),
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (p: number) => {
    const q = new URLSearchParams();
    if (action) q.set("action", action);
    if (target) q.set("target", target);
    if (sp.from) q.set("from", sp.from);
    if (sp.to) q.set("to", sp.to);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/admin/audit?${s}` : "/admin/audit";
  };

  return (
    <>
      <AdminTopbar title="Audit Log" />
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Append-only record of every privileged admin action. Normal admins cannot edit or delete these.
        </p>

        <form action="/admin/audit" method="get" className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="action" className="text-xs">Action</Label>
            <Input id="action" name="action" defaultValue={action} placeholder="e.g. user.suspend" className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target" className="text-xs">Target type</Label>
            <select
              id="target"
              name="target"
              defaultValue={target}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">All</option>
              <option value="user">user</option>
              <option value="qr_code">qr_code</option>
              <option value="export">export</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="from" className="text-xs">From</Label>
            <Input id="from" name="from" type="date" defaultValue={sp.from ?? ""} className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to" className="text-xs">To</Label>
            <Input id="to" name="to" type="date" defaultValue={sp.to ?? ""} className="h-9" />
          </div>
          <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
            <Button type="submit" size="sm">Apply filters</Button>
            {(action || target || sp.from || sp.to) && (
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link href="/admin/audit">Clear</Link>
              </Button>
            )}
          </div>
        </form>

        {!available ? (
          <MigrationRequired what="Audit filtering" />
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No audit entries match these filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">When</th>
                    <th className="px-5 py-2.5 font-medium">Admin</th>
                    <th className="px-5 py-2.5 font-medium">Action</th>
                    <th className="hidden px-5 py-2.5 font-medium md:table-cell">Target</th>
                    <th className="hidden px-5 py-2.5 font-medium lg:table-cell">Reason</th>
                    <th className="px-5 py-2.5 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r) => {
                    const hasMeta = r.metadata && Object.keys(r.metadata).length > 0;
                    return (
                      <tr key={r.id}>
                        <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-muted-foreground">{when(r.createdAt)}</td>
                        <td className="max-w-40 truncate px-5 py-2.5 text-xs">{r.adminEmail ?? r.adminUserId.slice(0, 8)}</td>
                        <td className="px-5 py-2.5 font-mono text-xs">{r.action}</td>
                        <td className="hidden max-w-40 truncate px-5 py-2.5 font-mono text-xs text-muted-foreground md:table-cell">
                          {r.targetType ? `${r.targetType}:${(r.targetId ?? "").slice(0, 8)}` : "—"}
                        </td>
                        <td className="hidden max-w-56 truncate px-5 py-2.5 text-xs text-muted-foreground lg:table-cell">
                          {r.reason ?? "—"}
                        </td>
                        <td className="px-5 py-2.5">
                          {hasMeta ? (
                            <details className="group">
                              <summary className="cursor-pointer list-none font-mono text-[11px] text-accent">view</summary>
                              <pre className="mt-1 max-w-xs overflow-x-auto rounded-md bg-muted p-2 text-[11px] whitespace-pre-wrap">
                                {JSON.stringify(r.metadata, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="font-mono text-[11px] text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {offset + 1}–{Math.min(offset + rows.length, total)} of {total.toLocaleString()}
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                  {page > 1 ? <Link href={pageLink(page - 1)}>Previous</Link> : <span>Previous</span>}
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
                  {page < totalPages ? <Link href={pageLink(page + 1)}>Next</Link> : <span>Next</span>}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
