import { Logo, HalfstackEndorser } from "@/components/brand/logo";
import { SmoothLink } from "@/components/marketing/smooth-link";
import { site } from "@/lib/site";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#pricing", label: "Pricing" },
      { href: `/alternatives/${site.alternatives[0]?.slug ?? ""}`, label: `vs ${site.incumbent.name}` },
      { href: "/status", label: "Status" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/blog", label: "Blog" },
      // Shared support inbox for all tools (see docs/ENGINEERING.md).
      { href: `mailto:${site.email}`, label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

const linkClass = "text-sm text-muted-foreground transition-colors hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-14 md:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{site.tagline}</p>
          <HalfstackEndorser className="mt-2" />
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading} className="flex flex-col gap-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {col.heading}
            </div>
            {col.links.map((link) => (
              <SmoothLink key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </SmoothLink>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>
            © {site.name}. {site.incumbent.name} is a trademark of its respective owner;{" "}
            {site.name} is independent and not affiliated with or endorsed by {site.incumbent.name}.
          </span>
          <span className="font-mono">{site.domain}</span>
        </div>
      </div>
    </footer>
  );
}
