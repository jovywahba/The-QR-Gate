"use client";

import * as React from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { archiveQr, restoreQr } from "./actions";

export function QRRowActions({
  qrCodeId,
  name,
  status,
  publicUrl,
}: {
  qrCodeId: string;
  name: string;
  status: string;
  publicUrl: string | null;
}) {
  const [pending, startTransition] = React.useTransition();

  const run = (action: () => Promise<{ error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(success);
    });

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" asChild aria-label={`Edit ${name}`}>
        <Link href={`/create?id=${qrCodeId}&step=2`}>
          <Pencil />
        </Link>
      </Button>
      {status === "published" && publicUrl && (
        <Button variant="ghost" size="icon" asChild aria-label={`Open public page for ${name}`}>
          <a href={publicUrl} target="_blank" rel="noreferrer">
            <ExternalLink />
          </a>
        </Button>
      )}
      {status === "archived" ? (
        <Button
          variant="ghost"
          size="icon"
          disabled={pending}
          onClick={() => run(() => restoreQr(qrCodeId), "QR code restored.")}
          aria-label={`Restore ${name}`}
        >
          <ArchiveRestore />
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={pending} aria-label={`Archive ${name}`}>
              <Archive />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive this QR code?</AlertDialogTitle>
              <AlertDialogDescription>
                Its public page stops working until you restore it. Nothing is deleted — printed
                codes start working again if you restore and republish.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it live</AlertDialogCancel>
              <AlertDialogAction onClick={() => run(() => archiveQr(qrCodeId), "QR code archived.")}>
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
