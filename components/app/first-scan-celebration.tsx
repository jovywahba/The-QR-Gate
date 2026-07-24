"use client";

import * as React from "react";
import { toast } from "sonner";
import { publicSupabaseConfig } from "@/lib/qr/config";
import { createClient } from "@/lib/supabase/client";

/**
 * When a QR gets its FIRST real human scan, the scan recorder writes one
 * "first_scan" notification for the owner. This shows a subtle celebration
 * toast the next time they load an authed page, then marks it read so it
 * never repeats. Bots/owner-previews never trigger it (the recorder gates
 * that). Respects prefers-reduced-motion (no disruptive full-screen effect).
 */
export function FirstScanCelebration() {
  React.useEffect(() => {
    if (!publicSupabaseConfig().configured) return;
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_notifications")
          .select("id, title, body, qr_code_id")
          .eq("type", "first_scan")
          .is("read_at", null)
          .order("created_at", { ascending: true })
          .limit(5);
        if (cancelled || !data?.length) return;

        const reduce =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        for (const n of data) {
          toast.success(n.title, {
            description: n.body ?? undefined,
            duration: reduce ? 4000 : 6500,
            action: n.qr_code_id
              ? {
                  label: "View analytics",
                  onClick: () => {
                    window.location.href = `/dashboard/qr-codes/${n.qr_code_id}/analytics`;
                  },
                }
              : undefined,
          });
        }

        // Mark read so the celebration never repeats.
        await supabase
          .from("user_notifications")
          .update({ read_at: new Date().toISOString() })
          .in("id", data.map((n) => n.id));
      } catch {
        // A missing table (pre-0005) or transient error is harmless here.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
