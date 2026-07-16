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

  // DEV ONLY — mirrors the middleware bypass so the marketing "Dashboard" shortcut
  // works without an auth flow in development. Remove before launch (prod redirects).
  const devBypass = process.env.NODE_ENV !== "production";
  if (!user && !devBypass) redirect("/sign-in");

  const email = user?.email ?? "demo@tryhalfstack.com";

  return (
    <div className="flex min-h-screen">
      <AppSidebar email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppMobileTopbar email={email} />
        {children}
      </div>
    </div>
  );
}
