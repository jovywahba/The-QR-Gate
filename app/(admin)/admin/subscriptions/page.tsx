import type { Metadata } from "next";
import Link from "next/link";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Subscriptions" };

function date(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export default async function AdminSubscriptionsPage() {
  await requireAdmin("view_subscriptions");
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

  const admin = createAdminClient();
  const [{ data: subs }, { data: comps }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("user_id, status, current_period_end, cancel_at_period_end, stripe_customer_id")
      .order("updated_at", { ascending: false })
      .limit(100),
    admin
      .from("complimentary_entitlements")
      .select("user_id, reason, expires_at, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const ids = [...new Set([...(subs ?? []).map((s) => s.user_id), ...(comps ?? []).map((c) => c.user_id)])];
  const email = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profs } = await admin.from("profiles").select("id, email").in("id", ids);
    for (const p of profs ?? []) if (p.email) email.set(p.id, p.email);
  }

  return (
    <>
      <AdminTopbar title="Subscriptions" />
      <div className="space-y-6 p-6">
        {!stripeConfigured ? (
          <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Billing is not configured on this deployment. Free accounts and complimentary Pro still work.
          </div>
        ) : null}

        <section>
          <h2 className="mb-3 text-sm font-semibold">Stripe subscriptions</h2>
          {(subs ?? []).length === 0 ? (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(subs ?? []).map((s) => (
                    <TableRow key={s.user_id}>
                      <TableCell>
                        <Link href={`/admin/users/${s.user_id}`} className="text-sm hover:underline">
                          {email.get(s.user_id) ?? s.user_id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {s.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {date(s.current_period_end)}
                      </TableCell>
                      <TableCell className="hidden text-xs md:table-cell">
                        {s.cancel_at_period_end ? "Yes" : "No"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Complimentary Pro (admin-granted)</h2>
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
                          {email.get(c.user_id) ?? c.user_id.slice(0, 8)}
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
      </div>
    </>
  );
}
