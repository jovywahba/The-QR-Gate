"use client";

import * as React from "react";
import { Archive, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { adminArchiveQr, adminPauseQr, adminUnpauseQr, type QrModResult } from "@/app/(admin)/admin/qr-codes/actions";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "./reason-dialog";

export function QrModActions({
  qrId,
  status,
  size = "sm",
}: {
  qrId: string;
  status: string;
  size?: "sm" | "default";
}) {
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<QrModResult>) =>
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else toast.success(r.message ?? "Done.");
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status === "paused" ? (
        <ReasonDialog
          trigger={
            <Button variant="outline" size={size} disabled={pending}>
              <Play aria-hidden />
              Unpause
            </Button>
          }
          title="Unpause this QR code?"
          description="Its public page starts working again. This is an admin override and is recorded in the audit log."
          confirmLabel="Unpause"
          reasonRequired={false}
          onConfirm={(reason) => run(() => adminUnpauseQr(qrId, reason))}
        />
      ) : status === "published" ? (
        <ReasonDialog
          trigger={
            <Button variant="outline" size={size} disabled={pending} className="text-destructive">
              <Pause aria-hidden />
              Pause
            </Button>
          }
          title="Pause this QR code?"
          description="Its public page stops resolving and shows a paused notice. The record, slug, and analytics are preserved."
          confirmLabel="Pause QR code"
          reasonRequired
          destructive
          onConfirm={(reason) => run(() => adminPauseQr(qrId, reason))}
        />
      ) : null}

      {status !== "archived" && (
        <ReasonDialog
          trigger={
            <Button variant="ghost" size={size} disabled={pending}>
              <Archive aria-hidden />
              Archive
            </Button>
          }
          title="Archive this QR code?"
          description="It stops resolving and frees the owner's free-plan slot. Nothing is deleted."
          confirmLabel="Archive"
          reasonRequired
          onConfirm={(reason) => run(() => adminArchiveQr(qrId, reason))}
        />
      )}
    </div>
  );
}
