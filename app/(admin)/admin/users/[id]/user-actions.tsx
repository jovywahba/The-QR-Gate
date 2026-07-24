"use client";

import * as React from "react";
import { KeyRound, ShieldOff, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminGrantComp, adminReactivateUser, adminRevokeComp, adminSendPasswordReset,
  adminSuspendUser, type ActionResult,
} from "./actions";

type Perms = {
  suspend: boolean;
  reset: boolean;
  entitlements: boolean;
};

export function UserActions({
  userId,
  suspended,
  hasComp,
  perms,
}: {
  userId: string;
  suspended: boolean;
  hasComp: boolean;
  perms: Perms;
}) {
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else toast.success(r.message ?? "Done.");
    });

  return (
    <div className="flex flex-wrap gap-2">
      {perms.reset && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(() => adminSendPasswordReset(userId))}
        >
          <KeyRound aria-hidden />
          Send password reset
        </Button>
      )}

      {perms.suspend &&
        (suspended ? (
          <ReasonDialog
            trigger={
              <Button variant="outline" size="sm" disabled={pending}>
                <ShieldCheck aria-hidden />
                Reactivate
              </Button>
            }
            title="Reactivate this account?"
            description="The user will be able to sign in and manage their QR codes again."
            confirmLabel="Reactivate"
            reasonRequired={false}
            onConfirm={(reason) => run(() => adminReactivateUser(userId, reason))}
          />
        ) : (
          <ReasonDialog
            trigger={
              <Button variant="outline" size="sm" disabled={pending} className="text-destructive">
                <ShieldOff aria-hidden />
                Suspend
              </Button>
            }
            title="Suspend this account?"
            description="Sign-in is blocked and active sessions are revoked. Nothing is deleted; you can reactivate later."
            confirmLabel="Suspend account"
            reasonRequired
            destructive
            onConfirm={(reason) => run(() => adminSuspendUser(userId, reason))}
          />
        ))}

      {perms.entitlements &&
        (hasComp ? (
          <ReasonDialog
            trigger={
              <Button variant="outline" size="sm" disabled={pending}>
                <XCircle aria-hidden />
                Remove comp Pro
              </Button>
            }
            title="Remove complimentary Pro?"
            description="Their real Stripe subscription (if any) is untouched. They revert to the free plan unless separately subscribed."
            confirmLabel="Remove"
            reasonRequired={false}
            onConfirm={(reason) => run(() => adminRevokeComp(userId, reason))}
          />
        ) : (
          <ReasonDialog
            trigger={
              <Button size="sm" disabled={pending}>
                <Sparkles aria-hidden />
                Grant comp Pro
              </Button>
            }
            title="Grant complimentary Pro?"
            description="Unlimited active QR codes, stored separately from Stripe. Optionally set an expiry date."
            confirmLabel="Grant"
            reasonRequired
            withExpiry
            onConfirm={(reason, expiry) => run(() => adminGrantComp(userId, reason, expiry))}
          />
        ))}
    </div>
  );
}

function ReasonDialog({
  trigger,
  title,
  description,
  confirmLabel,
  reasonRequired,
  destructive,
  withExpiry,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  reasonRequired: boolean;
  destructive?: boolean;
  withExpiry?: boolean;
  onConfirm: (reason: string, expiry: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [expiry, setExpiry] = React.useState("");

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason{reasonRequired ? "" : " (optional)"}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Logged in the audit trail"
            />
          </div>
          {withExpiry && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiry">Expires (optional)</Label>
              <Input id="expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            disabled={reasonRequired && !reason.trim()}
            onClick={() => onConfirm(reason.trim(), withExpiry && expiry ? expiry : null)}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
