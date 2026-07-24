"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Mounts inside the authenticated app shell and pings /api/presence every
 * ~75s (and once on mount / route change), so the admin "online now" count
 * reflects real activity. The per-tab id is a random opaque value — not a
 * token, not derived from anything identifying. Pauses while the tab is
 * hidden to avoid needless writes.
 */
function routeCategory(pathname: string): string {
  if (pathname.startsWith("/dashboard/qr-codes") && pathname.includes("/analytics")) return "Analytics";
  if (pathname.startsWith("/dashboard/billing")) return "Billing";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname.startsWith("/create")) return "Generator";
  return "Dashboard";
}

export function PresenceHeartbeat() {
  const pathname = usePathname();
  const sessionRef = React.useRef<string>("");
  if (!sessionRef.current && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    sessionRef.current = crypto.randomUUID();
  }

  React.useEffect(() => {
    let stopped = false;
    const ping = () => {
      if (stopped || document.visibilityState === "hidden") return;
      void fetch("/api/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionHash: sessionRef.current, route: routeCategory(pathname) }),
        keepalive: true,
      }).catch(() => {});
    };
    ping();
    const id = window.setInterval(ping, 75_000);
    document.addEventListener("visibilitychange", ping);
    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [pathname]);

  return null;
}
