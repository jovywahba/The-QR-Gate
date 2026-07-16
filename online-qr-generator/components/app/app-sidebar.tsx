import Link from "next/link";
import { site } from "@/lib/site";
import { AppNav } from "./app-nav";
import { UserMenu } from "./user-menu";

// Desktop sidebar (hidden below md — see app-mobile-topbar for the small-screen nav).
export function AppSidebar({ email }: { email?: string }) {
  return (
    <aside className="hidden w-56 flex-none flex-col border-r border-sidebar-border bg-sidebar p-3.5 md:flex">
      <Link
        href="/dashboard"
        className="px-2 pb-5 pt-1.5 text-lg font-semibold tracking-tight"
      >
        {site.name}
      </Link>

      <AppNav />

      <div className="mt-auto border-t border-sidebar-border pt-2">
        <UserMenu email={email} />
      </div>
    </aside>
  );
}
