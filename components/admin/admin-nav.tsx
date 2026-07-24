"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { hasPermission, type AdminRole, type Permission } from "@/lib/admin/roles";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; perm: Permission; exact?: boolean };

// One source of truth for the admin nav; each entry declares the permission
// required to see it, so a role only ever sees what it can actually open.
const ITEMS: Item[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, perm: "view_overview", exact: true },
  { href: "/admin/users", label: "Users", icon: Users, perm: "view_users" },
  { href: "/admin/qr-codes", label: "QR Codes", icon: QrCode, perm: "view_qr" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, perm: "view_subscriptions" },
  { href: "/admin/audit", label: "Audit Log", icon: ClipboardList, perm: "view_audit" },
  { href: "/admin/team", label: "Admin Team", icon: ShieldCheck, perm: "manage_admins" },
];

export function AdminNav({ role, onNavigate }: { role: AdminRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => hasPermission(role, i.perm));

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
