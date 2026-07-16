import { LayoutDashboard, Users, Building2, Target, CalendarCheck, Settings, CreditCard, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Static, on-brand mock of the product's main dashboard for the hero frame.
 * Purely presentational (no app logic/data) — mirrors the real CRM dashboard so
 * the landing page shows what users actually get. Swap freely per product.
 */

const NAV_MAIN = [{ icon: LayoutDashboard, label: "Dashboard", active: true }];
const NAV_CRM = [
  { icon: Users, label: "Contacts" },
  { icon: Building2, label: "Companies" },
  { icon: Target, label: "Deals" },
  { icon: CalendarCheck, label: "Activities" },
];
const NAV_ACCOUNT = [
  { icon: Settings, label: "Settings" },
  { icon: CreditCard, label: "Billing" },
];

const KPIS = [
  { label: "Pipeline value", value: "$276.6k", delta: "↑ 12% MoM" },
  { label: "Won · MTD", value: "$120k", delta: "↑ 1 deal" },
  { label: "Win rate", value: "50%", delta: "↑ 4 pts" },
  { label: "Open tasks", value: "5", delta: "2 due today", flat: true },
];

const BARS = [42, 38, 51, 47, 63, 58, 72, 84];

const PIPELINE = [
  { label: "Lead", value: "$15.6k", w: "10%", color: "#9A968A" },
  { label: "Qualified", value: "$42k", w: "28%", color: "#3B5BFF" },
  { label: "Proposal", value: "$150k", w: "100%", color: "#D9A21B" },
  { label: "Negotiation", value: "$69k", w: "46%", color: "#6E86FF" },
];

const DEALS = [
  { name: "Cedar Bank — Enterprise rollout", co: "Cedar Bank", stage: "Proposal", color: "#D9A21B", value: "$96k" },
  { name: "Harbor Logistics — Fleet", co: "Harbor Logistics", stage: "Proposal", color: "#D9A21B", value: "$54k" },
  { name: "Northwind — Platform expansion", co: "Northwind", stage: "Negotiation", color: "#6E86FF", value: "$48k" },
];

const TASKS = [
  { title: "Send pricing to Cedar Bank", meta: "Today", prio: "#C2392F" },
  { title: "Prep negotiation deck — Northwind", meta: "Today", prio: "#C2392F" },
  { title: "Follow up with Atlas Freight", meta: "Tomorrow", prio: "#D9A21B" },
];

function NavItem({ icon: Icon, label, active }: { icon: typeof Users; label: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]",
        active ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground" : "text-sidebar-foreground/70",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pt-2 pb-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground/70">
      {children}
    </div>
  );
}

export function HeroPreview() {
  const max = Math.max(...BARS);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-left">
      {/* Sidebar */}
      <aside className="hidden w-40 flex-none flex-col gap-0.5 border-r border-sidebar-border bg-sidebar p-3 sm:flex">
        <div className="px-1 pb-2 text-sm font-semibold tracking-tight">Acme</div>
        {NAV_MAIN.map((n) => (
          <NavItem key={n.label} {...n} />
        ))}
        <Eyebrow>CRM</Eyebrow>
        {NAV_CRM.map((n) => (
          <NavItem key={n.label} {...n} />
        ))}
        <Eyebrow>Account</Eyebrow>
        {NAV_ACCOUNT.map((n) => (
          <NavItem key={n.label} {...n} />
        ))}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-9 flex-none items-center justify-between border-b px-4">
          <span className="text-xs font-semibold">Dashboard</span>
          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1 rounded-md border px-2 py-1 text-[9px] text-muted-foreground md:inline-flex">
              Last 30 days <ChevronDown className="size-2.5" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground">
              <Plus className="size-2.5" /> New deal
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-3">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {KPIS.map((k) => (
              <div key={k.label} className="rounded-lg border bg-card p-2.5">
                <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="mt-0.5 font-mono text-sm font-medium tabular-nums">{k.value}</div>
                <div className={cn("font-mono text-[8px]", k.flat ? "text-muted-foreground" : "text-[#1B8A5B]")}>
                  {k.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Chart + pipeline */}
          <div className="grid flex-1 grid-cols-5 gap-2">
            <div className="col-span-3 flex flex-col rounded-lg border bg-card p-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Revenue</div>
                  <div className="font-mono text-xs font-medium tabular-nums">$84k</div>
                </div>
                <div className="flex gap-2 text-[9px]">
                  <span className="border-b border-foreground pb-0.5 font-medium text-foreground">Revenue</span>
                  <span className="text-muted-foreground">Deals</span>
                  <span className="text-muted-foreground">Leads</span>
                </div>
              </div>
              <div className="mt-auto flex h-14 items-end gap-1">
                {BARS.map((b, i) => (
                  <div
                    key={i}
                    className={cn("flex-1 rounded-sm", i === BARS.length - 1 ? "bg-accent" : "bg-muted-foreground/20")}
                    style={{ height: `${(b / max) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5 rounded-lg border bg-card p-2.5">
              <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Pipeline by stage</div>
              {PIPELINE.map((p) => (
                <div key={p.label} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="flex items-center gap-1">
                      <span className="size-1 rounded-full" style={{ background: p.color }} />
                      {p.label}
                    </span>
                    <span className="font-mono text-muted-foreground">{p.value}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: p.w, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open deals + my day */}
          <div className="grid flex-1 grid-cols-5 gap-2">
            <div className="col-span-3 flex flex-col overflow-hidden rounded-lg border bg-card">
              <div className="border-b px-2.5 py-2 text-[9px] font-semibold">Open deals</div>
              <div className="flex flex-col">
                {DEALS.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2 border-b px-2.5 py-1.5 last:border-0">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[9px] font-medium">{d.name}</span>
                      <span className="text-[8px] text-muted-foreground">{d.co}</span>
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      <span className="hidden items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] md:inline-flex">
                        <span className="size-1 rounded-full" style={{ background: d.color }} />
                        {d.stage}
                      </span>
                      <span className="font-mono text-[9px] tabular-nums">{d.value}</span>
                      <span className="flex size-4 items-center justify-center rounded-full bg-secondary text-[7px] font-medium text-secondary-foreground">
                        YO
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2 flex flex-col overflow-hidden rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-2.5 py-2">
                <span className="text-[9px] font-semibold">My day</span>
                <span className="flex gap-1.5 text-[8px]">
                  <span className="font-medium text-foreground">Tasks</span>
                  <span className="text-muted-foreground">Activity</span>
                </span>
              </div>
              <div className="flex flex-col">
                {TASKS.map((t) => (
                  <div key={t.title} className="flex items-start gap-1.5 border-b px-2.5 py-1.5 last:border-0">
                    <span className="mt-0.5 size-2.5 flex-none rounded-[3px] border border-input" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[9px]">{t.title}</span>
                      <span className="flex items-center gap-1 text-[8px] text-muted-foreground">
                        {t.meta} <span className="size-1 rounded-full" style={{ background: t.prio }} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
