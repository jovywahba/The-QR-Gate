import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { QrModActions } from "@/components/admin/qr-mod-actions";
import { QrThumb } from "@/components/app/qr-thumb";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasPermission } from "@/lib/admin/roles";
import { requireAdmin } from "@/lib/admin/guard";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "QR Code" };

function date(v: string | null): string {
  return v ? new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export default async function AdminQrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin("view_qr");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("qr_codes")
    .select("id, user_id, name, type, status, tracking_mode, destination_url, slug, created_at, updated_at, paused_at, pause_reason")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  const [{ data: owner }, { count: scans }] = await Promise.all([
    admin.from("profiles").select("id, email").eq("id", row.user_id).maybeSingle(),
    admin.from("qr_scan_events").select("id", { count: "exact", head: true }).eq("qr_code_id", id).eq("is_bot", false),
  ]);

  const publicUrl = row.status !== "archived" && row.tracking_mode === "hosted" ? row.destination_url : null;

  return (
    <>
      <AdminTopbar title="QR Code">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/qr-codes">
            <ArrowLeft aria-hidden />
            Back
          </Link>
        </Button>
      </AdminTopbar>

      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <QrThumb type={row.type} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{row.name || "Untitled QR"}</h2>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {row.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isQRType(row.type) ? getQRType(row.type).name : row.type}
                {" · owner "}
                <Link href={`/admin/users/${row.user_id}`} className="text-accent hover:underline">
                  {owner?.email ?? row.user_id.slice(0, 8)}
                </Link>
              </p>
            </div>
          </div>
          {hasPermission(ctx.role, "moderate_qr") ? (
            <QrModActions qrId={row.id} status={row.status} />
          ) : null}
        </div>

        {row.status === "paused" ? (
          <div className="rounded-lg border border-[#D9A21B]/40 bg-[#D9A21B]/5 px-4 py-3 text-sm">
            Paused {date(row.paused_at)}
            {row.pause_reason ? ` — ${row.pause_reason}` : ""}. Its public page shows a paused notice.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Scans" value={(scans ?? 0).toLocaleString()} />
          <StatCard label="Tracking" value={row.tracking_mode ?? "—"} />
          <StatCard label="Created" value={new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
          <StatCard label="Updated" value={new Date(row.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold">Public destination</h3>
          {publicUrl ? (
            <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 break-all text-sm text-accent hover:underline">
              {publicUrl}
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {row.tracking_mode === "native"
                ? "Native payload — no hosted page."
                : row.status === "archived"
                  ? "Archived — not resolving."
                  : "No hosted public page for this QR."}
            </p>
          )}
          {hasPermission(ctx.role, "view_analytics") ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Owner-scoped analytics live in the user&apos;s dashboard; admin analytics are aggregate only.
            </p>
          ) : null}
        </Card>
      </div>
    </>
  );
}
