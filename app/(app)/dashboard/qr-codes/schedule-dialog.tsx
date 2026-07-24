"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicSupabaseConfig } from "@/lib/qr/config";
import { createClient } from "@/lib/supabase/client";
import { setQrSchedule } from "./actions";

/** ISO (UTC) → value for <input type="datetime-local"> in the viewer's local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
const fromLocalInput = (v: string): string | null => (v ? new Date(v).toISOString() : null);

export function ScheduleDialog({
  open,
  onOpenChange,
  qrCodeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  qrCodeId: string;
}) {
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [fallback, setFallback] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [pending, startT] = React.useTransition();

  // Load the current schedule when the dialog opens (tolerates pre-migration DBs).
  React.useEffect(() => {
    if (!open || !publicSupabaseConfig().configured) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("qr_codes")
          .select("starts_at, ends_at, fallback_url")
          .eq("id", qrCodeId)
          .maybeSingle();
        if (cancelled) return;
        setStart(toLocalInput((data?.starts_at as string) ?? null));
        setEnd(toLocalInput((data?.ends_at as string) ?? null));
        setFallback((data?.fallback_url as string) ?? "");
      } catch {
        /* columns may not exist yet — open with empty fields */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, qrCodeId]);

  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;

  const save = () =>
    startT(async () => {
      const r = await setQrSchedule(qrCodeId, {
        startsAt: fromLocalInput(start),
        endsAt: fromLocalInput(end),
        timezone: tz,
        fallbackUrl: fallback.trim() || null,
      });
      if (r.error) toast.error(r.error);
      else {
        toast.success("Schedule saved.");
        onOpenChange(false);
      }
    });

  const clearAll = () =>
    startT(async () => {
      const r = await setQrSchedule(qrCodeId, { startsAt: null, endsAt: null, timezone: null, fallbackUrl: null });
      if (r.error) toast.error(r.error);
      else {
        toast.success("Schedule cleared.");
        onOpenChange(false);
      }
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule this QR code</DialogTitle>
          <DialogDescription>
            Set when this hosted QR is available. Times use your timezone{tz ? ` (${tz})` : ""};
            enforcement uses server time. Before the start it shows “not available yet”; after the end,
            “ended”.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sched-start">Starts</Label>
              <Input id="sched-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} disabled={loading} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sched-end">Ends</Label>
              <Input id="sched-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} disabled={loading} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sched-fallback">Fallback URL (optional)</Label>
            <Input
              id="sched-fallback"
              type="url"
              inputMode="url"
              placeholder="https://example.com"
              value={fallback}
              onChange={(e) => setFallback(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Where a tracked-redirect QR sends people when it isn’t open. Leave blank to show a notice.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={clearAll} disabled={pending || loading} className="text-muted-foreground">
            Clear schedule
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending || loading}>
              {pending ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
