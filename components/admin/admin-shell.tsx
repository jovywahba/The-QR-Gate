"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { hasPermission, ROLE_LABELS, type AdminRole } from "@/lib/admin/roles";
import { AdminNav } from "./admin-nav";
import { AdminGlobalSearch } from "./admin-search";

/**
 * The admin application shell — deliberately DISTINCT from the user
 * dashboard (ink sidebar, "Admin" wordmark, a role badge, and a shield
 * marker) so it never reads as Step 4 of the QR wizard. No creation
 * stepper appears anywhere in here.
 */
export function AdminShell({
  role,
  email,
  children,
}: {
  role: AdminRole;
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-none flex-col border-r border-sidebar-border bg-sidebar p-3.5 md:flex">
        <Brand role={role} />
        {hasPermission(role, "global_search") && (
          <div className="mt-4">
            <AdminGlobalSearch />
          </div>
        )}
        <div className="mt-4">
          <AdminNav role={role} />
        </div>
        <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-border pt-3">
          <p className="truncate px-2 text-xs text-muted-foreground" title={email}>
            {email}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft aria-hidden />
              Back to app
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="flex h-14 flex-none items-center justify-between border-b bg-card px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open admin menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetHeader className="p-3.5">
                <SheetTitle className="text-left">
                  <Brand role={role} />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-3.5">
                {hasPermission(role, "global_search") && <AdminGlobalSearch />}
                <AdminNav role={role} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold tracking-tight">Admin</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">App</Link>
          </Button>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function Brand({ role }: { role: AdminRole }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ShieldAlert className="size-4" aria-hidden />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">The QR Gate</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Admin · {ROLE_LABELS[role]}
        </div>
      </div>
    </div>
  );
}

/** Simple in-page admin header (title + optional actions). */
export function AdminTopbar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex h-14 flex-none items-center justify-between gap-3 border-b bg-card px-6">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
