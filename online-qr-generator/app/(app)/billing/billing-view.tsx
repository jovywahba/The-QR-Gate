"use client";

import { Check, Download, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { startCheckout, openPortal } from "./actions";

const PLANS = [
  { id: "starter", name: "Starter", price: 12, blurb: "For solo reps", features: ["1 seat", "1,000 contacts", "Email support"] },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    blurb: "For small teams",
    features: ["Up to 10 seats", "10,000 contacts", "Pipeline automation", "Priority support"],
    current: true,
  },
  { id: "business", name: "Business", price: 79, blurb: "For growing orgs", features: ["Unlimited seats", "Unlimited contacts", "SSO & audit logs", "Dedicated CSM"] },
];

const USAGE = [
  { label: "Seats", used: 8, total: 10, fmt: (n: number) => String(n) },
  { label: "Contacts", used: 2400, total: 5000, fmt: (n: number) => n.toLocaleString() },
  { label: "Emails sent", used: 12000, total: 50000, fmt: (n: number) => n.toLocaleString() },
];

const INVOICES = [
  { id: "INV-0007", date: "Jun 1, 2026", amount: 29 },
  { id: "INV-0006", date: "May 1, 2026", amount: 29 },
  { id: "INV-0005", date: "Apr 1, 2026", amount: 29 },
  { id: "INV-0004", date: "Mar 1, 2026", amount: 29 },
];

export function BillingView({ active, status }: { active: boolean; status: string | null }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      {/* Current plan + payment method */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">Pro plan</h2>
                  <Badge variant={active ? "accent" : "outline"} className="font-normal">
                    {status ?? (active ? "Active" : "No plan")}
                  </Badge>
                </div>
                <p className="font-mono text-sm text-muted-foreground">
                  $29 / mo · renews July 1, 2026
                </p>
              </div>
              {active ? (
                <form action={openPortal}>
                  <Button type="submit" size="sm">Manage billing</Button>
                </form>
              ) : (
                <form action={startCheckout}>
                  <Button type="submit" size="sm">Start {site.pricing.trialDays}-day trial</Button>
                </form>
              )}
            </div>
          </div>
          <div className="grid gap-px border-t bg-border sm:grid-cols-3">
            {USAGE.map((u) => {
              const pct = Math.min(Math.round((u.used / u.total) * 100), 100);
              const warn = pct >= 80;
              return (
                <div key={u.label} className="flex flex-col gap-2 bg-card p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                      {u.label}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="font-mono text-sm tabular-nums">
                    {u.fmt(u.used)} <span className="text-muted-foreground">/ {u.fmt(u.total)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", warn ? "bg-[#D9A21B]" : "bg-foreground")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="border-b p-5">
            <h2 className="text-sm font-semibold">Payment method</h2>
          </div>
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                <CreditCard className="size-4" />
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-sm">Visa •••• 4242</span>
                <span className="text-xs text-muted-foreground">Expires 08 / 27</span>
              </div>
            </div>
            <form action={openPortal}>
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Update payment method
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Billing email: <span className="font-mono">{site.email}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Plans */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn("flex flex-col gap-4 p-5", plan.current && "border-accent ring-1 ring-accent/30")}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  {plan.current ? (
                    <Badge variant="accent" className="font-normal">Current</Badge>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">{plan.blurb}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-medium tabular-nums">${plan.price}</span>
                <span className="text-xs text-muted-foreground">/ mo</span>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-3.5 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.current ? "outline" : "default"}
                size="sm"
                className="mt-auto"
                disabled={plan.current}
                onClick={() => toast(`Switching to ${plan.name} (demo)`)}
              >
                {plan.current ? "Current plan" : `Switch to ${plan.name}`}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <div className="border-b p-5">
          <h2 className="text-sm font-semibold">Billing history</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono">{inv.id}</TableCell>
                <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">${inv.amount}.00</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1.5 font-normal">
                    <span className="size-1.5 rounded-full" style={{ background: "#1B8A5B" }} />
                    Paid
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Download ${inv.id}`}
                    onClick={() => toast(`Downloading ${inv.id} (demo)`)}
                  >
                    <Download />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
