import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { QrThumb } from "@/components/app/qr-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin/guard";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { statusBadge } from "@/lib/qr/status-display";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "QR Codes" };

const FILTERS = ["all", "published", "draft", "paused", "archived"] as const;
type Filter = (typeof FILTERS)[number];

function date(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export default async function AdminQrCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("view_qr");
  const { status } = await searchParams;
  const filter: Filter = FILTERS.includes(status as Filter) ? (status as Filter) : "all";

  const admin = createAdminClient();
  let query = admin
    .from("qr_codes")
    .select("id, user_id, name, type, status, tracking_mode, destination_url, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (filter !== "all") query = query.eq("status", filter);
  const { data: rows } = await query;
  const list = rows ?? [];

  const ownerIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
  const ownerEmail = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: profs } = await admin.from("profiles").select("id, email").in("id", ownerIds);
    for (const p of profs ?? []) if (p.email) ownerEmail.set(p.id, p.email);
  }

  return (
    <>
      <AdminTopbar title="QR Codes" />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" asChild>
              <Link href={f === "all" ? "/admin/qr-codes" : `/admin/qr-codes?status=${f}`}>
                {f[0].toUpperCase() + f.slice(1)}
              </Link>
            </Button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No {filter === "all" ? "" : filter} QR codes.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Tracking</TableHead>
                  <TableHead className="hidden lg:table-cell">Updated</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Open</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r) => {
                  const badge = statusBadge(r.status);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <QrThumb type={r.type} size="sm" />
                          <span className="min-w-0">
                            <span className="block max-w-44 truncate text-sm font-medium">{r.name || "Untitled"}</span>
                            <span className="block text-xs text-muted-foreground">
                              {isQRType(r.type) ? getQRType(r.type).name : r.type}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-48 truncate text-xs text-muted-foreground md:table-cell">
                        {ownerEmail.get(r.user_id) ?? r.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase",
                            badge.tone === "published" && "border-[#1B8A5B]/40 text-[#1B8A5B]",
                            r.status === "paused" && "border-[#D9A21B]/50 text-[#D9A21B]",
                            badge.tone === "archived" && "text-muted-foreground",
                          )}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                        {r.tracking_mode ?? "—"}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                        {date(r.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/qr-codes/${r.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
