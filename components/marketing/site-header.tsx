import { Logo } from "@/components/brand/logo";
import { AccountNav } from "@/components/marketing/account-nav";
import { SmoothLink } from "@/components/marketing/smooth-link";

// On-page anchors smooth-scroll (via SmoothLink); /docs and /blog are real pages.
const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
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
