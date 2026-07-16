import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, QrCode } from "lucide-react";
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
import { serverSupabaseConfig } from "@/lib/qr/config";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { QRRowActions } from "./row-actions";

/**
 * Saved QR codes — server-rendered, RLS-scoped (the query can only
 * ever return the signed-in user's rows; ownership is never filtered
 * in the browser).
 */

export const metadata: Metadata = { title: "QR Codes" };

const FILTERS = ["all", "draft", "published", "archived"] as const;
type Filter = (typeof FILTERS)[number];

type QRRow = {
  id: string;
  name: string | null;
  type: string;
  status: string;
  destination_url: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function QRCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter: Filter = FILTERS.includes(params.status as Filter) ? (params.status as Filter) : "all";

  const config = serverSupabaseConfig();
  if (!config.configured) {
    return (
      <>
        <AppTopbar title="QR Codes" />
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

  let query = supabase
    .from("qr_codes")
    .select("id, name, type, status, destination_url, created_at, updated_at, published_at")
    .order("created_at", { ascending: false });
  if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;
  const rows = (data ?? []) as QRRow[];

  return (
    <>
      <AppTopbar title="QR Codes" />
      <div className="space-y-4 p-6">
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
                <Link href={f === "all" ? "/dashboard/qr-codes" : `/dashboard/qr-codes?status=${f}`}>
                  {f[0].toUpperCase() + f.slice(1)}
                </Link>
              </Button>
            ))}
          </div>
          <Button asChild>
            <Link href="/">
              <Plus aria-hidden />
              Create QR Code
            </Link>
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-12 text-center">
            <QrCode className="size-8 text-muted-foreground/60" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "You have not created any QR codes yet."
                : `No ${filter} QR codes.`}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Create QR Code</Link>
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
                  <TableHead className="hidden md:table-cell">Public URL</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="hidden lg:table-cell">Updated</TableHead>
                  <TableHead className="hidden xl:table-cell">Published</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-48 truncate font-medium">
                      {row.name || "Untitled"}
                    </TableCell>
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
                    <TableCell className="hidden max-w-56 md:table-cell">
                      {row.status === "published" && row.destination_url ? (
                        <a
                          href={row.destination_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate font-mono text-xs text-accent hover:underline"
                        >
                          {row.destination_url}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                      {formatDate(row.updated_at)}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">
                      {formatDate(row.published_at)}
                    </TableCell>
                    <TableCell>
                      <QRRowActions
                        qrCodeId={row.id}
                        name={row.name || "Untitled"}
                        status={row.status}
                        publicUrl={row.destination_url}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
