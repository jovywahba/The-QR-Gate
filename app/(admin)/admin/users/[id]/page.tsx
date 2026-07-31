import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { QrThumb } from "@/components/app/qr-thumb";
import { StatCard } from "@/components/app/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listUserNotes } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/roles";
import { requireAdmin } from "@/lib/admin/guard";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { statusBadge } from "@/lib/qr/status-display";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { UserActions, UserNotes } from "./user-actions";

export const metadata: Metadata = { title: "User" };

function date(v: string | null | undefined): string {
  return v ? new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin("view_user_detail");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Cross-user reads use the service role — the app guard above is the gate.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name, avatar_url, created_at, suspended_at, suspended_reason, stripe_customer_id")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const [{ data: qrRows }, { data: sub }, { data: comp }, { data: presence }, { data: auditRows }] =
    await Promise.all([
      admin.from("qr_codes").select("id, name, type, status, created_at").eq("user_id", id).order("created_at", { ascending: false }),
      admin.from("subscriptions").select("status, current_period_end, cancel_at_period_end, stripe_customer_id").eq("user_id", id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("complimentary_entitlements").select("id, reason, expires_at, created_at").eq("user_id", id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("user_presence").select("last_seen_at, route_category").eq("user_id", id).maybeSingle(),
      admin.from("admin_audit_logs").select("id, action, reason, created_at").eq("target_type", "user").eq("target_id", id).order("created_at", { ascending: false }).limit(8),
    ]);

  const qrIds = (qrRows ?? []).map((r) => r.id);
  let totalScans = 0;
  if (qrIds.length > 0) {
    const { count } = await admin
      .from("qr_scan_events")
      .select("id", { count: "exact", head: true })
      .in("qr_code_id", qrIds)
      .eq("is_bot", false);
    totalScans = count ?? 0;
  }

  // Internal notes (session client — the RPC re-checks the admin role).
  const canNotes = hasPermission(ctx.role, "manage_notes");
  const notes = canNotes
    ? await listUserNotes(await createClient(), id)
    : { available: false, rows: [] };

  const compActive = Boolean(comp && (!comp.expires_at || new Date(comp.expires_at) > new Date()));
  const subActive = sub?.status === "active" || sub?.status === "trialing";
  const isPro = subActive || compActive;
  const activeQr = (qrRows ?? []).filter((r) => r.status === "published").length;

  return (
    <>
      <AdminTopbar title="User">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft aria-hidden />
            Back
          </Link>
        </Button>
      </AdminTopbar>

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
              <AvatarFallback className="bg-secondary text-sm font-semibold">
                {(profile.full_name || profile.email || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{profile.full_name || "No name"}</h2>
                {profile.suspended_at ? (
                  <Badge variant="outline" className="border-destructive/40 font-mono text-[10px] uppercase text-destructive">
                    Suspended
                  </Badge>
                ) : null}
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {isPro ? "Pro" : "Free"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{profile.id}</p>
            </div>
          </div>
          <UserActions
            userId={profile.id}
            suspended={Boolean(profile.suspended_at)}
            hasComp={compActive}
            perms={{
              suspend: hasPermission(ctx.role, "suspend_users"),
              reset: hasPermission(ctx.role, "reset_password"),
              entitlements: hasPermission(ctx.role, "manage_entitlements"),
              revokeSessions: hasPermission(ctx.role, "revoke_sessions"),
              exportData: hasPermission(ctx.role, "export_user_data"),
            }}
          />
        </div>

        {profile.suspended_at ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            Suspended {date(profile.suspended_at)}
            {profile.suspended_reason ? ` — ${profile.suspended_reason}` : ""}.
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total QR Codes" value={String(qrRows?.length ?? 0)} />
          <StatCard label="Active QR Codes" value={String(activeQr)} />
          <StatCard label="Total Scans" value={totalScans.toLocaleString()} />
          <StatCard label="Joined" value={new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Plan / subscription */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold">Plan &amp; billing</h3>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <Row k="Plan" v={isPro ? "Pro" : "Free"} />
              <Row k="Stripe status" v={sub?.status ?? "—"} />
              <Row k="Renews" v={date(sub?.current_period_end)} />
              <Row k="Comp Pro" v={compActive ? (comp?.expires_at ? `until ${date(comp?.expires_at)}` : "active") : "—"} />
            </dl>
            {compActive && comp?.reason ? (
              <p className="mt-2 text-xs text-muted-foreground">Comp reason: {comp.reason}</p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Card details are never shown here — Stripe remains the source of truth.
            </p>
          </Card>

          {/* Activity */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold">Activity</h3>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <Row k="Last seen" v={date(presence?.last_seen_at)} />
              <Row k="Last area" v={presence?.route_category ?? "—"} />
            </dl>
          </Card>

          {/* Recent admin actions */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold">Admin history</h3>
            {(auditRows ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No admin actions recorded.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2 text-xs">
                {(auditRows ?? []).map((a) => (
                  <li key={a.id} className="flex flex-col">
                    <span className="font-mono">{a.action}</span>
                    <span className="text-muted-foreground">
                      {date(a.created_at)}
                      {a.reason ? ` · ${a.reason}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Internal notes */}
        {canNotes && (
          <Card>
            <div className="border-b p-5">
              <h3 className="text-sm font-semibold">Internal notes</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Visible to admins &amp; support only — never shown to the user.
              </p>
            </div>
            <div className="p-5">
              <UserNotes userId={profile.id} notes={notes.rows} available={notes.available} canAdd={canNotes} />
            </div>
          </Card>
        )}

        {/* QR codes */}
        <Card>
          <div className="border-b p-5">
            <h3 className="text-sm font-semibold">QR codes ({qrRows?.length ?? 0})</h3>
          </div>
          {(qrRows ?? []).length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">This user has no QR codes.</p>
          ) : (
            <ul className="divide-y">
              {(qrRows ?? []).map((r) => {
                const badge = statusBadge(r.status);
                return (
                  <li key={r.id} className="flex items-center gap-3 p-4">
                    <QrThumb type={r.type} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.name || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground">
                        {isQRType(r.type) ? getQRType(r.type).name : r.type}
                      </div>
                    </div>
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
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/qr-codes/${r.id}`}>Open</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
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
