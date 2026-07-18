"use client";

import * as React from "react";
import { Check, CreditCard, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FREE_ACTIVE_LIMIT,
  PRO_PLAN_NAME,
  PRO_PRICE_USD,
  statusLabel,
  type PlanStatus,
} from "@/lib/billing/plan";
import { cn } from "@/lib/utils";
import { openPortal, startCheckout } from "./actions";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const PRO_FEATURES = ["Unlimited active QR codes", "Full scan analytics", "All QR types & customization"];

function StatusBanner({ statusParam, plan }: { statusParam: string | null; plan: PlanStatus }) {
  let tone: "ok" | "warn" | null = null;
  let message = "";
  if (statusParam === "success") {
    tone = "ok";
    message = "Payment received. Your subscription updates the moment Stripe confirms it.";
  } else if (statusParam === "cancelled") {
    tone = "warn";
    message = "Checkout was canceled — you have not been charged.";
  } else if (statusParam === "unconfigured") {
    tone = "warn";
    message = "Billing isn't set up on this deployment yet.";
  } else if (plan.status === "past_due") {
    tone = "warn";
    message = "Your last payment failed. Update your payment method to keep Pro active.";
  }
  if (!tone) return null;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border p-3 text-sm",
        tone === "ok" ? "border-[#1B8A5B]/40 bg-[#1B8A5B]/5" : "border-[#D9A21B]/40 bg-[#D9A21B]/5",
      )}
    >
      {tone === "ok" ? (
        <Check className="mt-0.5 size-4 shrink-0 text-[#1B8A5B]" aria-hidden />
      ) : (
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#D9A21B]" aria-hidden />
      )}
      <p>{message}</p>
    </div>
  );
}

export function BillingView({
  plan,
  billingReady,
  statusParam,
}: {
  plan: PlanStatus;
  billingReady: boolean;
  statusParam: string | null;
}) {
  const usedPct = Math.min(Math.round((plan.activeCount / FREE_ACTIVE_LIMIT) * 100), 100);
  const lapsed = !plan.isUnlimited && plan.status && plan.status !== "canceled";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <StatusBanner statusParam={statusParam} plan={plan} />

      {plan.isUnlimited ? (
        /* ── Active Pro ── */
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">{PRO_PLAN_NAME}</h2>
                <Badge variant="accent" className="font-normal">
                  {statusLabel(plan.status)}
                </Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">${PRO_PRICE_USD}.00 / month</p>
            </div>
            <form action={openPortal}>
              <Button type="submit" size="sm">
                <CreditCard aria-hidden />
                Manage billing
              </Button>
            </form>
          </div>
          <p className="text-sm text-muted-foreground">
            {plan.cancelAtPeriodEnd
              ? `Cancels on ${formatDate(plan.currentPeriodEnd)} — you keep Pro until then.`
              : `Renews on ${formatDate(plan.currentPeriodEnd)}.`}
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="size-3.5 text-accent" aria-hidden /> {f}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        /* ── Free (or lapsed Pro) ── */
        <>
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Free Plan</h2>
              {lapsed && (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {statusLabel(plan.status)}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-sm tabular-nums">
                  {plan.activeCount} of {FREE_ACTIVE_LIMIT} QR codes used
                </span>
                <span className="font-mono text-xs text-muted-foreground">{usedPct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", usedPct >= 100 ? "bg-[#D9A21B]" : "bg-foreground")}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
            {lapsed && (
              <p className="text-xs text-muted-foreground">
                Your {PRO_PLAN_NAME} subscription is {statusLabel(plan.status).toLowerCase()}. Existing QR
                codes and their public pages keep working.
              </p>
            )}
          </Card>

          <Card className="flex flex-col gap-4 border-accent/40 p-5 ring-1 ring-accent/20">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" aria-hidden />
              <h2 className="text-sm font-semibold">Upgrade to {PRO_PLAN_NAME}</h2>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-medium tabular-nums">${PRO_PRICE_USD}</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-3.5 text-accent" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            {billingReady ? (
              <form action={startCheckout}>
                <input type="hidden" name="returnTo" value="/dashboard/billing?status=success" />
                <Button type="submit" className="w-full">
                  {lapsed ? "Reactivate Pro" : "Upgrade to Pro"} — ${PRO_PRICE_USD}/mo
                </Button>
              </form>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                Online checkout isn&apos;t configured on this deployment yet. Set the Stripe keys and the
                Pro price to enable upgrades.
              </div>
            )}
          </Card>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Questions about billing? Contact{" "}
        <a href="mailto:info@tryhalfstack.com" className="text-accent hover:underline">
          info@tryhalfstack.com
        </a>
        .
      </p>
    </div>
  );
}
