import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { CopyButton } from "@/components/admin/copy-button";
import { QrThumb } from "@/components/app/qr-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAdminQrs, type AdminQrFilter, type AdminQrRow } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { publicQrUrl, trackedRedirectUrl } from "@/lib/qr/public-url";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { scheduleState } from "@/lib/qr/schedule";
import { cn } from "@/lib/utils";
import { MigrationRequired } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "QR Codes" };

const FILTERS: AdminQrFilter[] = ["all", "published", "draft", "paused", "archived", "scheduled", "expired"];

function date(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

/** The public URL a hosted / tracked QR resolves to (null for native/direct). */
function publicUrlFor(r: AdminQrRow): string | null {
  if (!r.slug) return null;
  if (r.trackingMode === "hosted") return publicQrUrl(r.slug);
  if (r.trackingMode === "redirect") return trackedRedirectUrl(r.slug);
  return null;
}

/** Human schedule state for the row (Live / Scheduled / Ended). */
function scheduleLabel(r: AdminQrRow): string | null {
  if (!r.startsAt && !r.endsAt) return null;
  const st = scheduleState(r.startsAt, r.endsAt, Date.now());
  return st === "scheduled" ? "Scheduled" : st === "expired" ? "Ended" : "Live window";
}

export default async function AdminQrCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin("view_qr");
  const { status, q } = await searchParams;
  const filter: AdminQrFilter = FILTERS.includes(status as AdminQrFilter) ? (status as AdminQrFilter) : "all";
  const search = (q ?? "").trim();

  const supabase = await createClient();
  const { available, rows } = await listAdminQrs(supabase, { search: search || undefined, filter, limit: 100 });

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const s = patch.status ?? (filter === "all" ? undefined : filter);
    const query = patch.q ?? (search || undefined);
    if (s) p.set("status", s);
    if (query) p.set("q", query);
    const str = p.toString();
    return str ? `/admin/qr-codes?${str}` : "/admin/qr-codes";
  };

  return (
    <>
      <AdminTopbar title="QR Codes" />
      <div className="space-y-4 p-6">
        <form action="/admin/qr-codes" method="get" className="flex max-w-xl gap-2">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input name="q" type="search" defaultValue={search} placeholder="Search by owner email, QR name, ID, or slug" className="pl-9" />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" asChild>
              <Link href={qs({ status: f === "all" ? undefined : f })}>{f[0].toUpperCase() + f.slice(1)}</Link>
            </Button>
          ))}
        </div>

        {!available ? (
          <MigrationRequired what="Admin QR management" />
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No QR codes match{search ? ` “${search}”` : ` this filter`}.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Scans</TableHead>
                  <TableHead className="hidden xl:table-cell text-right">Unique</TableHead>
                  <TableHead className="hidden xl:table-cell">Last scan</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const url = publicUrlFor(r);
                  const sched = scheduleLabel(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <QrThumb type={r.type} size="sm" />
                          <span className="min-w-0">
                            <span className="block max-w-44 truncate text-sm font-medium">{r.name || "Untitled"}</span>
                            <span className="block text-xs text-muted-foreground">
                              {isQRType(r.type) ? getQRType(r.type).name : r.type}
                              {r.versionCount > 0 ? ` · v${r.versionCount}` : ""}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-48 truncate text-xs text-muted-foreground md:table-cell">
                        {r.ownerEmail ? (
                          <Link href={`/admin/users/${r.ownerId}`} className="hover:underline">{r.ownerEmail}</Link>
                        ) : (
                          r.ownerId.slice(0, 8)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px] uppercase",
                              r.status === "published" && "border-[#1B8A5B]/40 text-[#1B8A5B]",
                              r.status === "paused" && "border-[#D9A21B]/50 text-[#D9A21B]",
                              r.status === "archived" && "text-muted-foreground",
                            )}
                          >
                            {r.status}
                          </Badge>
                          {r.moderationLocked && (
                            <Badge variant="outline" className="border-destructive/40 font-mono text-[10px] uppercase text-destructive">
                              Locked
                            </Badge>
                          )}
                          {sched && (
                            <Badge variant="outline" className="font-mono text-[10px] uppercase text-muted-foreground">
                              {sched}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-right font-mono text-xs tabular-nums lg:table-cell">
                        {r.scans.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden text-right font-mono text-xs tabular-nums text-muted-foreground xl:table-cell">
                        {r.uniqueVisitors.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">
                        {date(r.lastScanAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {url && <CopyButton value={url} iconOnly />}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/qr-codes/${r.id}`}>Open</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Admin views never expose WiFi passwords, protected content, or other private payloads.
          Health score &amp; password-protection state show on the QR detail once those features ship.
        </p>
      </div>
    </>
  );
}
