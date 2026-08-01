import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { CopyButton } from "@/components/admin/copy-button";
import { QrModActions } from "@/components/admin/qr-mod-actions";
import { QrThumb } from "@/components/app/qr-thumb";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminQrDetail } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/roles";
import { requireAdmin } from "@/lib/admin/guard";
import { publicQrUrl, trackedRedirectUrl } from "@/lib/qr/public-url";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { scheduleState } from "@/lib/qr/schedule";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "QR Code" };

function date(v: string | null): string {
  return v ? new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export default async function AdminQrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin("view_qr");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { row } = await getAdminQrDetail(supabase, id);
  if (!row) notFound();

  const publicUrl =
    row.slug && row.status !== "archived"
      ? row.trackingMode === "hosted"
        ? publicQrUrl(row.slug)
        : row.trackingMode === "redirect"
          ? trackedRedirectUrl(row.slug)
          : null
      : null;
  const sched =
    row.startsAt || row.endsAt ? scheduleState(row.startsAt, row.endsAt, Date.now()) : null;

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
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{row.name || "Untitled QR"}</h2>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">{row.status}</Badge>
                {row.moderationLocked && (
                  <Badge variant="outline" className="border-destructive/40 font-mono text-[10px] uppercase text-destructive">
                    Locked
                  </Badge>
                )}
                {sched && (
                  <Badge variant="outline" className="font-mono text-[10px] uppercase text-muted-foreground">
                    {sched === "scheduled" ? "Scheduled" : sched === "expired" ? "Ended" : "Live window"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isQRType(row.type) ? getQRType(row.type).name : row.type}
                {" · owner "}
                <Link href={`/admin/users/${row.ownerId}`} className="text-accent hover:underline">
                  {row.ownerEmail ?? row.ownerId.slice(0, 8)}
                </Link>
              </p>
            </div>
          </div>
          {hasPermission(ctx.role, "moderate_qr") ? <QrModActions qrId={row.id} status={row.status} /> : null}
        </div>

        {row.status === "paused" && (
          <div className="rounded-lg border border-[#D9A21B]/40 bg-[#D9A21B]/5 px-4 py-3 text-sm">
            Paused{row.pauseReason ? ` — ${row.pauseReason}` : ""}. Its public page shows a paused notice.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Scans" value={row.scans.toLocaleString()} />
          <StatCard label="Unique Visitors" value={row.uniqueVisitors.toLocaleString()} />
          <StatCard label="Versions" value={row.versionCount.toLocaleString()} />
          <StatCard label="Last Scan" value={row.lastScanAt ? date(row.lastScanAt) : "Never"} />
        </div>

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Public destination</h3>
            {publicUrl && <CopyButton value={publicUrl} />}
          </div>
          {publicUrl ? (
            <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 break-all text-sm text-accent hover:underline">
              {publicUrl}
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {row.trackingMode === "native"
                ? "Native payload — no hosted page."
                : row.status === "archived"
                  ? "Archived — not resolving."
                  : "No hosted public page for this QR."}
            </p>
          )}
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <Row k="Tracking" v={row.trackingMode ?? "—"} />
            <Row k="Created" v={date(row.createdAt)} />
            <Row k="Published" v={date(row.publishedAt)} />
            <Row k="Updated" v={date(row.updatedAt)} />
            {(row.startsAt || row.endsAt) && (
              <>
                <Row k="Starts" v={date(row.startsAt)} />
                <Row k="Ends" v={date(row.endsAt)} />
              </>
            )}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Version history is owner-scoped ({row.versionCount} version{row.versionCount === 1 ? "" : "s"}).
            Admin views never expose WiFi passwords or protected content. Health score &amp; password state
            surface here once those features ship.
          </p>
        </Card>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate font-mono text-xs">{v}</dd>
    </div>
  );
}
