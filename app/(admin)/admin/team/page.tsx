import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/guard";
import { ROLE_LABELS, isAdminRole } from "@/lib/admin/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { GrantRoleForm, RevokeRoleButton } from "./team-manager";

export const metadata: Metadata = { title: "Admin Team" };

function date(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export default async function AdminTeamPage() {
  const ctx = await requireAdmin("manage_admins");

  const admin = createAdminClient();
  const { data: members } = await admin
    .from("admin_memberships")
    .select("user_id, role, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const ids = (members ?? []).map((m) => m.user_id);
  const email = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profs } = await admin.from("profiles").select("id, email").in("id", ids);
    for (const p of profs ?? []) if (p.email) email.set(p.id, p.email);
  }

  return (
    <>
      <AdminTopbar title="Admin Team" />
      <div className="space-y-6 p-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Grant admin access</h2>
          <p className="mb-4 mt-0.5 text-xs text-muted-foreground">
            The person must already have an account. Only super admins can manage the team, and you
            can never change your own role. Every change is audited.
          </p>
          <GrantRoleForm />
        </Card>

        <Card>
          <div className="border-b p-5">
            <h2 className="text-sm font-semibold">Admins ({members?.length ?? 0})</h2>
          </div>
          <ul className="divide-y">
            {(members ?? []).map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {email.get(m.user_id) ?? m.user_id.slice(0, 8)}
                    {m.user_id === ctx.userId ? <span className="ml-2 text-xs text-muted-foreground">(you)</span> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">Since {date(m.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {isAdminRole(m.role) ? ROLE_LABELS[m.role] : m.role}
                  </Badge>
                  {m.user_id !== ctx.userId ? (
                    <RevokeRoleButton userId={m.user_id} email={email.get(m.user_id) ?? m.user_id} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
