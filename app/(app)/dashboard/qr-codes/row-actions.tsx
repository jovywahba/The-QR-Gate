"use client";

import * as React from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  BarChart3,
  Copy,
  Download,
  ExternalLink,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveQr, restoreQr } from "./actions";

export function QRRowActions({
  qrCodeId,
  name,
  status,
  trackable,
  publicUrl,
  copyUrl,
}: {
  qrCodeId: string;
  name: string;
  status: string;
  trackable: boolean;
  publicUrl: string | null;
  copyUrl: string | null;
}) {
  const [pending, startTransition] = React.useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const run = (action: () => Promise<{ error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(success);
    });

  async function copyLink() {
    if (!copyUrl) return;
    try {
      await navigator.clipboard.writeText(copyUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`} disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {trackable && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/qr-codes/${qrCodeId}/analytics`}>
                <BarChart3 />
                View analytics
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={`/create?id=${qrCodeId}&step=2`}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/create?id=${qrCodeId}&step=4`}>
              <Download />
              Download
            </Link>
          </DropdownMenuItem>
          {publicUrl && (
            <DropdownMenuItem asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                Open public page
              </a>
            </DropdownMenuItem>
          )}
          {copyUrl && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void copyLink();
              }}
            >
              <Copy />
              Copy link
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {status === "archived" ? (
            <DropdownMenuItem onSelect={() => run(() => restoreQr(qrCodeId), "QR code restored.")}>
              <ArchiveRestore />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Archive />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <span className="sr-only" aria-hidden />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this QR code?</AlertDialogTitle>
            <AlertDialogDescription>
              Its public page stops working until you restore it, and it frees a slot on the free plan.
              Nothing is deleted — printed codes start working again if you restore and republish.
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
    </div>
  );
}
