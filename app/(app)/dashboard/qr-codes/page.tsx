import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, QrCode, Sparkles } from "lucide-react";
import { AppTopbar } from "@/components/app/app-topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { QRRowActions } from "./row-actions";

/**
 * My QR Codes — server-rendered, RLS-scoped (the query can only ever
 * return the signed-in user's rows). Real scan counts come from the
 * owner-scoped get_user_qr_summaries() RPC.
 */

export const metadata: Metadata = { title: "My QR Codes" };

const FILTERS = ["all", "published", "draft", "archived"] as const;
type Filter = (typeof FILTERS)[number];
const SORTS = ["newest", "oldest", "scans", "recent"] as const;
type Sort = (typeof SORTS)[number];
const SORT_LABEL: Record<Sort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  scans: "Most scanned",
  recent: "Recently scanned",
};

type Summary = { scans: number; unique: number; last: string | null };

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function QRCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const filter: Filter = FILTERS.includes(params.status as Filter) ? (params.status as Filter) : "all";
  const sort: Sort = SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : "newest";

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
    .select("id, name, type, status, slug, tracking_mode, destination_url, created_at, updated_at, published_at");
  if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;
  const rows = data ?? [];

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

  const enriched = rows.map((r) => ({ ...r, summary: summaries.get(r.id) ?? { scans: 0, unique: 0, last: null } }));
  enriched.sort((a, b) => {
    switch (sort) {
      case "oldest":
        return +new Date(a.created_at) - +new Date(b.created_at);
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
    if (status) sp.set("status", status);
    if (s) sp.set("sort", s);
    const qs = sp.toString();
    return qs ? `/dashboard/qr-codes?${qs}` : "/dashboard/qr-codes";
  };

  return (
    <>
      <AppTopbar title="My QR Codes">
        <Button size="sm" asChild>
          <Link href="/">
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
              {filter === "all" ? "You have not created any QR codes yet." : `No ${filter} QR codes.`}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Create your first QR code</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Scans</TableHead>
                  <TableHead className="hidden md:table-cell">Last scan</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map((row) => {
                  const trackable = row.tracking_mode === "hosted" || row.tracking_mode === "redirect";
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="max-w-48 truncate font-medium">{row.name || "Untitled"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {isQRType(row.type) ? getQRType(row.type).name : row.type}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase",
                            row.status === "published" && "border-[#1B8A5B]/40 text-[#1B8A5B]",
                            row.status === "archived" && "text-muted-foreground",
                          )}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {trackable ? row.summary.scans.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {trackable ? formatDate(row.summary.last) : "—"}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                        {formatDate(row.created_at)}
                      </TableCell>
                      <TableCell>
                        <QRRowActions
                          qrCodeId={row.id}
                          name={row.name || "Untitled"}
                          status={row.status}
                          trackable={trackable}
                          publicUrl={
                            row.status === "published"
                              ? row.tracking_mode === "hosted"
                                ? row.destination_url
                                : null
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
        )}
      </div>
    </>
  );
}
