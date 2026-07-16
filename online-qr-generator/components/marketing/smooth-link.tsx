"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Link that smooth-scrolls to same-page section anchors (e.g. "/#features")
 * instead of snapping. Used by the header nav and the footer.
 *  - mailto:/external → plain <a>
 *  - "/#section" on the landing page → preventDefault + smooth scrollIntoView
 *  - everything else → next/link (from a sub-page, "/#section" navigates home
 *    then the browser lands on the section)
 */
export function SmoothLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isExternal = href.startsWith("mailto:") || href.startsWith("http");
  const hash = href.includes("#") ? href.split("#")[1] : "";

  if (isExternal) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (hash && pathname === "/") {
      const el = document.getElementById(hash);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", `#${hash}`);
      }
    }
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
