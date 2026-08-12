"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AccountNav } from "@/components/marketing/account-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HeaderUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/utils";

/**
 * The ONE global header for the whole product — marketing pages and the
 * generator both render this, so the app reads as a single product (no
 * separate marketing/generator headers). Every item is a real page.
 *
 *  - `initialUser` is resolved server-side → the account control renders
 *    the correct state on first paint (no auth flash).
 *  - `stepper` (optional) renders as a full-width sub-bar under the nav —
 *    the generator passes its wizard progress here.
 */

const NAV = [
  { href: "/", label: "QR Generator" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  initialUser,
  stepper,
}: {
  initialUser?: HeaderUser;
  stepper?: React.ReactNode;
}) {
  const pathname = usePathname() || "/";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-sm transition-colors",
                    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile: the nav collapses into a compact menu (no crowding). */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {NAV.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <AccountNav initialUser={initialUser} />
        </div>
      </div>

      {stepper ? <div className="border-t bg-card/60">{stepper}</div> : null}
    </header>
  );
}
