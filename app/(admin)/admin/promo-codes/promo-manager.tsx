"use client";

import * as React from "react";
import { Ban, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { PromoRow } from "@/lib/stripe/promos-server";
import { createPromo, deactivatePromo } from "./actions";

function date(unix: number | null): string {
  return unix ? new Date(unix * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export function PromoManager({ promos }: { promos: PromoRow[] }) {
  const [discountType, setDiscountType] = React.useState<"percent" | "amount">("percent");
  const [duration, setDuration] = React.useState<"once" | "repeating" | "forever">("once");
  const [pending, start] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await createPromo({
        code: String(fd.get("code") ?? ""),
        discountType,
        percentOff: String(fd.get("percentOff") ?? ""),
        amountOffDollars: String(fd.get("amountOffDollars") ?? ""),
        duration,
        durationMonths: String(fd.get("durationMonths") ?? ""),
        maxRedemptions: String(fd.get("maxRedemptions") ?? ""),
        expiresAt: String(fd.get("expiresAt") ?? ""),
      });
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.message ?? "Created.");
        formRef.current?.reset();
      }
    });
  };

  const onDeactivate = (id: string, code: string) =>
    start(async () => {
      const r = await deactivatePromo(id);
      if (r.error) toast.error(r.error);
      else toast.success(r.message ?? `${code} deactivated.`);
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
      {/* Create form */}
      <form ref={formRef} onSubmit={onCreate} className="h-fit space-y-4 rounded-lg border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <TicketPercent className="size-4 text-accent" aria-hidden />
          New promo code
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" required placeholder="SUMMER25" className="font-mono uppercase" autoCapitalize="characters" />
          <p className="text-[11px] text-muted-foreground">A–Z, 0–9, _ or -. Customers type this at checkout.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Discount</Label>
          <RadioGroup
            value={discountType}
            onValueChange={(v) => setDiscountType(v as "percent" | "amount")}
            className="grid grid-cols-2 gap-2"
          >
            <Label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-accent">
              <RadioGroupItem value="percent" /> Percent
            </Label>
            <Label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-accent">
              <RadioGroupItem value="amount" /> Amount
            </Label>
          </RadioGroup>
        </div>

        {discountType === "percent" ? (
          <div className="space-y-1.5">
            <Label htmlFor="percentOff">Percent off</Label>
            <div className="relative">
              <Input id="percentOff" name="percentOff" type="number" min={1} max={100} step="1" defaultValue="20" required className="pr-8" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="amountOffDollars">Amount off (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input id="amountOffDollars" name="amountOffDollars" type="number" min="0.01" step="0.01" defaultValue="5.00" required className="pl-7" />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="duration">Applies</Label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value as "once" | "repeating" | "forever")}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="once">First payment only</option>
            <option value="repeating">For N months</option>
            <option value="forever">Every payment (forever)</option>
          </select>
        </div>

        {duration === "repeating" && (
          <div className="space-y-1.5">
            <Label htmlFor="durationMonths">Months</Label>
            <Input id="durationMonths" name="durationMonths" type="number" min={1} max={36} step="1" defaultValue="3" required />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="maxRedemptions">Max uses</Label>
            <Input id="maxRedemptions" name="maxRedemptions" type="number" min={1} step="1" placeholder="∞" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">Expires</Label>
            <Input id="expiresAt" name="expiresAt" type="date" />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create promo code"}
        </Button>
      </form>

      {/* Existing codes */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Active &amp; past codes ({promos.length})</h2>
        {promos.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
            No promo codes yet. Create one on the left.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="hidden md:table-cell">Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">{p.code}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.discount}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {p.timesRedeemed}
                      {p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ""}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                      {date(p.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          p.active
                            ? "inline-flex items-center rounded-full bg-[#1B8A5B]/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-[#1B8A5B]"
                            : "inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-muted-foreground"
                        }
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.active && (
                        <Button variant="ghost" size="sm" disabled={pending} onClick={() => onDeactivate(p.id, p.code)}>
                          <Ban aria-hidden />
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
