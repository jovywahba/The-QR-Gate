import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, QrCode, Search, Sparkles } from "lucide-react";
import { AppTopbar } from "@/components/app/app-topbar";
import { QrThumb } from "@/components/app/qr-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FREE_ACTIVE_LIMIT } from "@/lib/billing/plan";
import { getPlanStatus } from "@/lib/billing/plan-server";
import { serverSupabaseConfig } from "@/lib/qr/config";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { scanDisplay, statusBadge } from "@/lib/qr/status-display";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { QRRowActions } from "./row-actions";

/**
 * My QR Codes — server-rendered, RLS-scoped (the query can only ever
 * return the signed-in user's rows). Real scan counts come from the
 * owner-scoped get_user_qr_summaries() RPC; filters/search/sort run
 * over that already-owned set.
 */

export const metadata: Metadata = { title: "My QR Codes" };

const FILTERS = ["all", "published", "draft", "archived"] as const;
type Filter = (typeof FILTERS)[number];
const SORTS = ["newest", "updated", "scans", "recent"] as const;
type Sort = (typeof SORTS)[number];
const SORT_LABEL: Record<Sort, string> = {
  newest: "Newest",
  updated: "Recently updated",
  scans: "Most scanned",
  recent: "Recently scanned",
};

type Row = {
  id: string;
  name: string | null;
  type: string;
  status: string;
  slug: string | null;
  tracking_mode: string | null;
  destination_url: string | null;
  created_at: string;
  updated_at: string;
};
type Summary = { scans: number; unique: number; last: string | null };

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function destinationSummary(row: Row): string {
  if (row.type === "wifi") return "Wi-Fi network";
  if (row.type === "vcard") return "Contact card";
  if (row.destination_url) return row.destination_url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return row.status === "published" ? "—" : "Not published yet";
}

export default async function QRCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const filter: Filter = FILTERS.includes(params.status as Filter) ? (params.status as Filter) : "all";
  const sort: Sort = SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : "newest";
  const q = (params.q ?? "").trim();
  const qLower = q.toLowerCase();

  const config = serverSupabaseConfig();
  if (!config.configured) {
    return (
      <>
        <AppTopbar title="My QR Codes" />
        <div className="p-6">
          <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
            The dashboard needs Supabase. Missing:{" "}
            <span className="font-mono text-xs">{config.missing.join(", ")}</span>
          </div>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/dashboard/qr-codes");

  const plan = await getPlanStatus(supabase);

  let query = supabase
    .from("qr_codes")
    .select("id, name, type, status, slug, tracking_mode, destination_url, created_at, updated_at");
  if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;
  const rows = (data ?? []) as Row[];

  // Real scan counts (owner-scoped RPC), merged by id.
  const { data: summariesRaw } = await supabase.rpc("get_user_qr_summaries");
  const summaries = new Map<string, Summary>();
  for (const s of (summariesRaw ?? []) as Array<Record<string, unknown>>) {
    if (typeof s.id === "string") {
      summaries.set(s.id, {
        scans: typeof s.scans === "number" ? s.scans : 0,
        unique: typeof s.unique_scans === "number" ? s.unique_scans : 0,
        last: typeof s.last_scanned === "string" ? s.last_scanned : null,
      });
    }
  }

  const enriched = rows
    .map((r) => ({
      ...r,
      typeName: isQRType(r.type) ? getQRType(r.type).name : r.type,
      summary: summaries.get(r.id) ?? { scans: 0, unique: 0, last: null },
    }))
    .filter((r) => {
      if (!qLower) return true;
      return (
        (r.name ?? "").toLowerCase().includes(qLower) ||
        r.typeName.toLowerCase().includes(qLower) ||
        (r.destination_url ?? "").toLowerCase().includes(qLower)
      );
    });

  enriched.sort((a, b) => {
    switch (sort) {
      case "updated":
        return +new Date(b.updated_at) - +new Date(a.updated_at);
      case "scans":
        return b.summary.scans - a.summary.scans;
      case "recent":
        return (b.summary.last ? +new Date(b.summary.last) : 0) - (a.summary.last ? +new Date(a.summary.last) : 0);
      default:
        return +new Date(b.created_at) - +new Date(a.created_at);
    }
  });

  const withQuery = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const status = patch.status ?? (filter === "all" ? undefined : filter);
    const s = patch.sort ?? (sort === "newest" ? undefined : sort);
    const search = patch.q ?? (q || undefined);
    if (status) sp.set("status", status);
    if (s) sp.set("sort", s);
    if (search) sp.set("q", search);
    const qs = sp.toString();
    return qs ? `/dashboard/qr-codes?${qs}` : "/dashboard/qr-codes";
  };

  return (
    <>
      <AppTopbar title="My QR Codes">
        <Button size="sm" asChild>
          <Link href="/create?new=1">
            <Plus aria-hidden />
            Create QR Code
          </Link>
        </Button>
      </AppTopbar>

      <div className="space-y-4 p-6">
        {!plan.isUnlimited && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
            <p className="text-sm">
              <span className="font-mono tabular-nums">
                {plan.activeCount} of {FREE_ACTIVE_LIMIT}
              </span>{" "}
              free QR codes used
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/billing">
                <Sparkles aria-hidden />
                Upgrade to Pro
              </Link>
            </Button>
          </div>
        )}

        {/* Search */}
        <form method="get" className="relative max-w-sm">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name, type, or destination…"
            aria-label="Search QR codes"
            className="pl-9"
          />
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                asChild
                aria-current={filter === f ? "true" : undefined}
              >
                <Link href={withQuery({ status: f === "all" ? undefined : f })}>
                  {f[0].toUpperCase() + f.slice(1)}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sort">
            {SORTS.map((s) => (
              <Button key={s} variant={sort === s ? "secondary" : "ghost"} size="sm" asChild>
                <Link href={withQuery({ sort: s === "newest" ? undefined : s })}>{SORT_LABEL[s]}</Link>
              </Button>
            ))}
          </div>
        </div>

        {enriched.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-12 text-center">
            <QrCode className="size-8 text-muted-foreground/60" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {q
                ? `No QR codes match “${q}”.`
                : filter === "all"
                  ? "You have not created any QR codes yet."
                  : `No ${filter} QR codes.`}
            </p>
            {!q && (
              <Button asChild size="sm">
                <Link href="/create?new=1">Create your first QR code</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {enriched.map((row) => {
                const scan = scanDisplay(row.tracking_mode ?? "hosted", row.summary.scans);
                const badge = statusBadge(row.status);
                const trackable = row.tracking_mode === "hosted" || row.tracking_mode === "redirect";
                return (
                  <li key={row.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <QrThumb type={row.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{row.name || "Untitled"}</span>
                          <StatusPill badge={badge} />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.typeName} · {destinationSummary(row)}
                        </p>
                      </div>
                      <QRRowActions
                        qrCodeId={row.id}
                        name={row.name || "Untitled"}
                        status={row.status}
                        trackable={trackable}
                        publicUrl={
                          row.status === "published" && row.tracking_mode === "hosted"
                            ? row.destination_url
                            : null
                        }
                        copyUrl={row.status === "published" ? row.destination_url : null}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-xs">
                      <span className={scan.kind === "count" ? "text-foreground" : "text-muted-foreground"}>
                        {scan.label}
                        {scan.kind === "count" && row.summary.unique > 0 ? (
                          <span className="text-muted-foreground"> · {row.summary.unique} unique</span>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground">Updated {formatDate(row.updated_at)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>QR Code</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Destination</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Unique</TableHead>
                    <TableHead className="hidden xl:table-cell">Last scan</TableHead>
                    <TableHead className="hidden lg:table-cell">Updated</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enriched.map((row) => {
                    const scan = scanDisplay(row.tracking_mode ?? "hosted", row.summary.scans);
                    const badge = statusBadge(row.status);
                    const trackable = row.tracking_mode === "hosted" || row.tracking_mode === "redirect";
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <QrThumb type={row.type} size="sm" />
                            <span className="max-w-44 truncate font-medium">{row.name || "Untitled"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {row.typeName}
                        </TableCell>
                        <TableCell>
                          <StatusPill badge={badge} />
                        </TableCell>
                        <TableCell className="hidden max-w-52 truncate text-xs text-muted-foreground xl:table-cell">
                          {destinationSummary(row)}
                        </TableCell>
                        <TableCell
                          title={scan.label}
                          className={cn(
                            "text-right font-mono text-sm tabular-nums",
                            scan.kind === "count" ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {scan.kind === "count" ? scan.scans.toLocaleString() : shortScan(scan.kind)}
                        </TableCell>
                        <TableCell className="hidden text-right font-mono text-sm tabular-nums text-muted-foreground lg:table-cell">
                          {trackable && row.summary.scans > 0 ? row.summary.unique.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">
                          {trackable ? formatDate(row.summary.last) : "—"}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                          {formatDate(row.updated_at)}
                        </TableCell>
                        <TableCell>
                          <QRRowActions
                            qrCodeId={row.id}
                            name={row.name || "Untitled"}
                            status={row.status}
                            trackable={trackable}
                            publicUrl={
                              row.status === "published" && row.tracking_mode === "hosted"
                                ? row.destination_url
                                : null
                            }
                            copyUrl={row.status === "published" ? row.destination_url : null}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/** Compact label for the narrow Scans column (full text is in the cell title). */
function shortScan(kind: "none" | "disabled" | "native"): string {
  if (kind === "native") return "Native";
  if (kind === "disabled") return "Not tracked";
  return "No scans";
}

function StatusPill({ badge }: { badge: { label: string; tone: string } }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] uppercase",
        badge.tone === "published" && "border-[#1B8A5B]/40 text-[#1B8A5B]",
        badge.tone === "archived" && "text-muted-foreground",
      )}
    >
      {badge.label}
    </Badge>
  );
}
