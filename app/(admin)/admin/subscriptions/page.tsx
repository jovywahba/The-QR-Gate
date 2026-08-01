import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { MigrationRequired } from "@/components/admin/admin-ui";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAdminSubscriptions } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Subscriptions" };

const FREE_LIMIT = site.pricing.freeQrLimit;

function date(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

const STATUS_STYLE: Record<string, string> = {
  active: "border-[#1B8A5B]/40 text-[#1B8A5B]",
  trialing: "border-accent/40 text-accent",
  past_due: "border-[#D9A21B]/50 text-[#D9A21B]",
  unpaid: "border-destructive/40 text-destructive",
  canceled: "text-muted-foreground",
};

export default async function AdminSubscriptionsPage() {
  await requireAdmin("view_subscriptions");
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

  const supabase = await createClient();
  const { available, rows } = await listAdminSubscriptions(supabase, { limit: 200 });

  // Complimentary entitlements are kept SEPARATE from Stripe (service-role read).
  const { data: comps } = await createAdminClient()
    .from("complimentary_entitlements")
    .select("user_id, reason, expires_at, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);
  const compIds = [...new Set((comps ?? []).map((c) => c.user_id))];
  const compEmail = new Map<string, string>();
  if (compIds.length > 0) {
    const { data: profs } = await createAdminClient().from("profiles").select("id, email").in("id", compIds);
    for (const p of profs ?? []) if (p.email) compEmail.set(p.id, p.email);
  }

  const count = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <>
      <AdminTopbar title="Subscriptions" />
      <div className="space-y-6 p-6">
        {!stripeConfigured && (
          <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Billing isn&apos;t configured on this deployment. Free accounts and complimentary Pro still work.
          </div>
        )}

        {available && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active" value={count("active").toLocaleString()} />
            <StatCard label="Trialing" value={count("trialing").toLocaleString()} />
            <StatCard label="Past Due" value={(count("past_due") + count("unpaid")).toLocaleString()} />
            <StatCard label="Canceled" value={count("canceled").toLocaleString()} />
          </div>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold">Stripe subscriptions</h2>
          {!available ? (
            <MigrationRequired what="Subscription usage" />
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              No Stripe subscriptions yet. Stripe remains the source of truth for paid plans.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Renews</TableHead>
                    <TableHead className="hidden md:table-cell">Cancel at period end</TableHead>
                    <TableHead className="text-right">Active QR usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => {
                    const paid = s.status === "active" || s.status === "trialing";
                    return (
                      <TableRow key={s.userId}>
                        <TableCell>
                          <Link href={`/admin/users/${s.userId}`} className="text-sm hover:underline">
                            {s.email ?? s.userId.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-mono text-[10px] uppercase", STATUS_STYLE[s.status])}>
                            {s.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                          {date(s.currentPeriodEnd)}
                        </TableCell>
                        <TableCell className="hidden text-xs md:table-cell">
                          {s.cancelAtPeriodEnd ? (
                            <span className="text-[#D9A21B]">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {s.activeQr.toLocaleString()}{" "}
                          <span className="text-muted-foreground">/ {paid ? "∞" : FREE_LIMIT}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Complimentary Pro (admin-granted, separate from Stripe)</h2>
          {(comps ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No complimentary Pro grants are active.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Reason</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="hidden md:table-cell">Granted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(comps ?? []).map((c, i) => (
                    <TableRow key={`${c.user_id}-${i}`}>
                      <TableCell>
                        <Link href={`/admin/users/${c.user_id}`} className="text-sm hover:underline">
                          {compEmail.get(c.user_id) ?? c.user_id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden max-w-64 truncate text-xs text-muted-foreground md:table-cell">
                        {c.reason ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {c.expires_at ? date(c.expires_at) : "No expiry"}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {date(c.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          Card numbers and payment secrets are never shown — Stripe remains the source of truth.
        </p>
      </div>
    </>
  );
}
