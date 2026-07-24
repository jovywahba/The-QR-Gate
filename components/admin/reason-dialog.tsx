"use client";

import * as React from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * A confirm dialog that captures an audit reason (and, optionally, an
 * expiry date). Shared by every privileged admin action so the reason
 * requirement + audit intent are consistent across the panel.
 */
export function ReasonDialog({
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
      <button type="button" className="contents" onClick={() => setOpen(true)}>
        {trigger}
      </button>
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
