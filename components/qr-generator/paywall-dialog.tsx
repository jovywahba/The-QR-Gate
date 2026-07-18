"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { startCheckout } from "@/app/(app)/dashboard/billing/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PRO_PLAN_NAME, PRO_PRICE_USD } from "@/lib/billing/plan";
import { useQRWizard } from "./use-qr-wizard";

/**
 * Shown when a free account hits the 3-QR limit while committing a new
 * QR. "Upgrade to Pro" starts a REAL Stripe Checkout (server action)
 * and returns the user to this exact step afterwards, so they finish
 * publishing without recreating anything.
 */
export function PaywallDialog() {
  const { paywall, dismissPaywall, state } = useQRWizard();
  const open = paywall !== null;

  const returnTo = state.selectedType
    ? `/create?type=${state.selectedType}&step=4`
    : "/dashboard/billing?status=success";

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? dismissPaywall() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You&apos;ve used all 3 free QR codes</DialogTitle>
          <DialogDescription>
            Upgrade to {PRO_PLAN_NAME} for ${PRO_PRICE_USD}/month to create unlimited QR codes and unlock
            scan analytics. Your existing codes keep working either way.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" aria-hidden /> Unlimited active QR codes
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" aria-hidden /> Full scan analytics
          </li>
        </ul>

        <DialogFooter className="gap-2 sm:flex-col sm:items-stretch">
          <form action={startCheckout}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button type="submit" className="w-full">
              Upgrade to Pro — ${PRO_PRICE_USD}/mo
            </Button>
          </form>
          <Button variant="outline" asChild>
            <a href="/dashboard/qr-codes">Manage my QR codes</a>
          </Button>
          <Button variant="ghost" onClick={dismissPaywall}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
