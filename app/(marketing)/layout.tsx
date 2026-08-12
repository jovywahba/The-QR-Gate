import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getHeaderUser } from "@/lib/auth/current-user";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await getHeaderUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader initialUser={initialUser} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
