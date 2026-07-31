"use client";

import * as React from "react";
import { Download, KeyRound, LogOut, ShieldOff, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserNote } from "@/lib/admin/data";
import {
  adminAddNote, adminExportUserData, adminGrantComp, adminReactivateUser, adminRevokeComp,
  adminRevokeSessions, adminSendPasswordReset, adminSuspendUser, type ActionResult,
} from "./actions";

type Perms = {
  suspend: boolean;
  reset: boolean;
  entitlements: boolean;
  revokeSessions: boolean;
  exportData: boolean;
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

  const doExport = () =>
    start(async () => {
      const r = await adminExportUserData(userId);
      if (r.error || !r.json) {
        toast.error(r.error ?? "Couldn't export.");
        return;
      }
      const url = URL.createObjectURL(new Blob([r.json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename ?? `user-${userId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("User data exported.");
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

      {perms.revokeSessions && !suspended && (
        <ReasonDialog
          trigger={
            <Button variant="outline" size="sm" disabled={pending}>
              <LogOut aria-hidden />
              Revoke sessions
            </Button>
          }
          title="Revoke this user's sessions?"
          description="Forces the user to sign in again on all devices. The account is NOT suspended — they can log back in immediately."
          confirmLabel="Revoke sessions"
          reasonRequired={false}
          onConfirm={(reason) => run(() => adminRevokeSessions(userId, reason))}
        />
      )}

      {perms.exportData && (
        <Button variant="outline" size="sm" disabled={pending} onClick={doExport}>
          <Download aria-hidden />
          Export data
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

/** Internal admin/support notes — list + add form. Notes are never shown to the user. */
export function UserNotes({
  userId,
  notes,
  available,
  canAdd,
}: {
  userId: string;
  notes: UserNote[];
  available: boolean;
  canAdd: boolean;
}) {
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();

  const add = () =>
    start(async () => {
      const r = await adminAddNote(userId, body);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setBody("");
      toast.success("Note added.");
      // Server action revalidated the path; refresh the RSC tree to show it.
      window.location.reload();
    });

  return (
    <div>
      {canAdd && (
        <div className="mb-4 flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add an internal note (visible to admins/support only)…"
            rows={2}
          />
          <div className="flex justify-end">
            <Button size="sm" disabled={pending || !body.trim()} onClick={add}>
              Add note
            </Button>
          </div>
        </div>
      )}
      {!available ? (
        <p className="text-sm text-muted-foreground">Notes need migration 0006 applied.</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border bg-background p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                {n.authorEmail ?? "admin"} · {new Date(n.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </li>
          ))}
        </ul>
      )}
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
