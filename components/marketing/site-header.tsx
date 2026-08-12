import { Logo } from "@/components/brand/logo";
import { AccountNav } from "@/components/marketing/account-nav";
import { SmoothLink } from "@/components/marketing/smooth-link";

// Every item is a real page (no dead on-page anchors — the homepage is the
// generator, not a long marketing scroll). Features + FAQ live on /pricing.
const NAV = [
  { href: "/", label: "QR Generator" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-15 max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <SmoothLink
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </SmoothLink>
            ))}
          </nav>
        </div>
        <AccountNav />
      </div>
    </header>
  );
}
