"use client";

import * as React from "react";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_ROLES, ROLE_LABELS, type AdminRole } from "@/lib/admin/roles";
import { adminRevokeRole, adminSetRoleByEmail } from "./actions";

export function GrantRoleForm() {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<AdminRole>("support");
  const [reason, setReason] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await adminSetRoleByEmail(email, role, reason);
          if (r.error) toast.error(r.error);
          else {
            toast.success(r.message ?? "Done.");
            setEmail("");
            setReason("");
          }
        });
      }}
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="team-email">Email</Label>
        <Input id="team-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="team-role">Role</Label>
        <select
          id="team-role"
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          {ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="team-reason">Reason</Label>
        <Input id="team-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Audit note" />
      </div>
      <Button type="submit" disabled={pending}>
        <UserPlus aria-hidden />
        Grant
      </Button>
    </form>
  );
}

export function RevokeRoleButton({ userId, email }: { userId: string; email: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-destructive"
      onClick={() =>
        start(async () => {
          const r = await adminRevokeRole(userId, `Revoked ${email}`);
          if (r.error) toast.error(r.error);
          else toast.success(r.message ?? "Revoked.");
        })
      }
    >
      <X aria-hidden />
      Revoke
    </Button>
  );
}
