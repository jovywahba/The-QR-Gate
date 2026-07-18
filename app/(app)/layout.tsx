import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppMobileTopbar } from "@/components/app/app-mobile-topbar";

// Auth guard (defense in depth — middleware also protects these routes).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const account = {
    email: user.email ?? "",
    name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null,
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar account={account} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppMobileTopbar account={account} />
        {children}
      </div>
    </div>
  );
}
