"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, LayoutDashboard, LogOut, Plus, QrCode, Settings } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { publicSupabaseConfig } from "@/lib/qr/config";
import { createClient } from "@/lib/supabase/client";

/**
 * Auth-aware header controls, shared by the marketing site and the
 * builder. Logged out → "Sign in" + "Create QR Code". Logged in →
 * an account dropdown (Dashboard · My QR Codes · Billing · Sign out).
 * Never shows Sign in and Sign out at once.
 */

type Who = { email: string; name: string | null; avatarUrl: string | null } | null;

function initials(who: NonNullable<Who>): string {
  const base = who.name || who.email;
  const parts = base.trim().split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function AccountNav() {
  const [who, setWho] = React.useState<Who>(null);
  const [ready, setReady] = React.useState(false);
  const configured = React.useMemo(() => publicSupabaseConfig().configured, []);

  React.useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    let cancelled = false;
    const load = (u: { email?: string; user_metadata?: Record<string, unknown> } | null) =>
      setWho(
        u
          ? {
              email: u.email ?? "",
              name: (u.user_metadata?.full_name as string | undefined) ?? null,
              avatarUrl: (u.user_metadata?.avatar_url as string | undefined) ?? null,
            }
          : null,
      );
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) {
          load(data.user);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => load(session?.user ?? null));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  if (ready && who) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <Avatar className="size-8">
              {who.avatarUrl ? <AvatarImage src={who.avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials(who)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
            {who.name || who.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/qr-codes">
              <QrCode />
              My QR Codes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/create?new=1">
              <Plus />
              Create New QR
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/billing">
              <CreditCard />
              Billing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={signOut} className="w-full">
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <LogOut />
                Sign out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/">
          <Plus aria-hidden />
          Create QR Code
        </Link>
      </Button>
    </div>
  );
}
