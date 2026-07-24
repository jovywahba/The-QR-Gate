import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/guard";

// The admin surface is never indexed and never confirms its existence to
// non-admins (requireAdmin → 404). Session verification + role lookup happen
// server-side here, and again inside every privileged database function.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin("view_admin");
  return (
    <AdminShell role={ctx.role} email={ctx.email}>
      {children}
    </AdminShell>
  );
}
