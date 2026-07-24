import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppMobileTopbar } from "@/components/app/app-mobile-topbar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { PresenceHeartbeat } from "@/components/app/presence-heartbeat";
import { site } from "@/lib/site";

// Auth guard (defense in depth — middleware also protects these routes).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, suspended_at")
    .eq("id", user.id)
    .maybeSingle();

  // A suspended account is blocked at the auth level (a long ban invalidates
  // its sessions); this closes the short window before an existing access
  // token expires by refusing to render any authed content.
  if (profile?.suspended_at) {
    return <SuspendedNotice />;
  }

  // Cheap indexed lookup — reveals the "Admin" menu entry only to real admins.
  const { data: isAdmin } = await supabase.rpc("is_active_admin");

  const account = {
    email: user.email ?? "",
    name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null,
    isAdmin: Boolean(isAdmin),
  };

  return (
    <div className="flex min-h-screen">
      <PresenceHeartbeat />
      <AppSidebar account={account} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppMobileTopbar account={account} />
        {children}
      </div>
    </div>
  );
}

function SuspendedNotice() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldOff aria-hidden />
      </span>
      <h1 className="text-lg font-semibold">Your account is suspended</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Access to your dashboard is paused. If you think this is a mistake, contact us at{" "}
        <a href={`mailto:${site.email}`} className="text-accent hover:underline">
          {site.email}
        </a>
        .
      </p>
      <Link href="/" className="text-sm text-accent hover:underline">
        Back to home
      </Link>
    </div>
  );
}
