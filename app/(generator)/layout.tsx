import type { ReactNode } from "react";
import { SiteFooter } from "@/components/marketing/site-footer";

/**
 * The generator (homepage Step 1 + /create) runs its own focused wizard
 * shell with a compact header. We append the SAME marketing footer used
 * across the rest of the site so the tool and the marketing pages read as
 * one product — not two separate websites. The extra bottom padding on
 * mobile keeps the last footer line clear of the fixed "Preview" bar that
 * floats at the bottom of the wizard below the `lg` breakpoint.
 */
export default function GeneratorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div className="pb-16 lg:pb-0">
        <SiteFooter />
      </div>
    </>
  );
}
