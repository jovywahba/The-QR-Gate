"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { site } from "@/lib/site";
import { AppNav } from "./app-nav";
import { UserMenu } from "./user-menu";

// Shown only below md: hamburger opens the same nav in a left Sheet. The desktop
// sidebar is hidden at this breakpoint (see app-sidebar).
export function AppMobileTopbar({ email }: { email?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 flex-none items-center justify-between border-b bg-card px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetHeader className="p-3.5">
            <SheetTitle className="text-left text-lg font-semibold tracking-tight">
              {site.name}
            </SheetTitle>
          </SheetHeader>
          <div className="px-3.5">
            <AppNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" className="text-base font-semibold tracking-tight">
        {site.name}
      </Link>

      <UserMenu email={email} />
    </header>
  );
}
