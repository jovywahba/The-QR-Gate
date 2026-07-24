"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, Plus, QrCode, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; matchPath?: string };
type NavGroup = { label?: string; items: NavItem[] };

// Single source of truth for the product's primary nav — shared by the desktop
// sidebar and the mobile sheet so they never drift.
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/qr-codes", label: "My QR Codes", icon: QrCode },
      // Fresh start — clears any leftover draft (see /create?new=1).
      { href: "/create?new=1", label: "Create QR", icon: Plus, matchPath: "/create" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {group.label ? (
            <div className="px-3 pt-1 pb-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </div>
          ) : null}
          {group.items.map((item) => {
            const target = item.matchPath ?? item.href;
            const active = item.exact ? pathname === target : pathname.startsWith(target);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
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
        </div>
      ))}
    </nav>
  );
}
