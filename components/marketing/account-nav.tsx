"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { HeaderUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/client";

/**
 * Auth-aware header controls, shared by the marketing site and the
 * builder. Logged out → "Sign in" + "Create QR Code". Logged in →
 * an account dropdown (Dashboard · My QR Codes · Billing · Sign out).
 * Never shows Sign in and Sign out at once.
 *
 * `initialUser` is resolved SERVER-SIDE and passed in, so the correct
 * state renders on the very first paint — no signed-out → signed-in flash
 * on navigation. When it's omitted (undefined), we fall back to a neutral
 * skeleton (never the signed-out buttons) until the client session loads.
 */

type Who = { email: string; name: string | null; avatarUrl: string | null } | null;

function initials(who: NonNullable<Who>): string {
  const base = who.name || who.email;
  const parts = base.trim().split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function AccountNav({ initialUser }: { initialUser?: HeaderUser }) {
  // Server gave us the authoritative state → start there, already "ready".
  const router = useRouter();
  const seeded = initialUser !== undefined;
  const [who, setWho] = React.useState<Who>(initialUser ?? null);
  const [ready, setReady] = React.useState(seeded);
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
    // Read the session from the local cookie (no network round-trip → fast),
    // unless the server already seeded us.
    if (!seeded) {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!cancelled) {
            load(data.session?.user ?? null);
            setReady(true);
          }
        })
        .catch(() => {
          if (!cancelled) setReady(true);
        });
    }
    // Keep the header in sync with live sign-in / sign-out, and on a real
    // transition refresh the server components so the whole app updates
    // without the user having to reload the page manually.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      load(session?.user ?? null);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.refresh();
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured, seeded, router]);

  // Genuinely loading (no server seed): a neutral avatar-sized placeholder —
  // NEVER the signed-out buttons (which would flash "Sign in").
  if (!ready) {
    return <div aria-hidden className="size-8 animate-pulse rounded-full bg-muted" />;
  }

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
          {/* Narrow phones (≤ ~400px) show the short label so the header
              never overflows horizontally; roomier viewports get the full CTA. */}
          <span className="min-[400px]:hidden">Create</span>
          <span className="hidden min-[400px]:inline">Create QR Code</span>
        </Link>
      </Button>
    </div>
  );
}
