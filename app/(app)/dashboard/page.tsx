"use client";

import { useState } from "react";
import { Plus, ArrowUpRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { AppTopbar } from "@/components/app/app-topbar";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  DEALS,
  TASKS,
  ACTIVITIES,
  SERIES,
  MONTHS,
  STAGE_META,
  COMPANIES,
  money,
  type DealStage,
} from "../_demo/data";
import { StageBadge, BarChart, ActivityIcon, Initials, PriorityFlag, Dot } from "../_demo/widgets";

const OPEN_STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation"];
type Metric = "revenue" | "deals" | "leads";

export default function DashboardPage() {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [tasks, setTasks] = useState(TASKS);
  const [createOpen, setCreateOpen] = useState(false);

  const openDeals = DEALS.filter((d) => OPEN_STAGES.includes(d.stage));
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const wonValue = DEALS.filter((d) => d.stage === "won").reduce((s, d) => s + d.value, 0);
  const wonCount = DEALS.filter((d) => d.stage === "won").length;
  const lostCount = DEALS.filter((d) => d.stage === "lost").length;
  const winRate = Math.round((wonCount / Math.max(wonCount + lostCount, 1)) * 100);
  const openTaskCount = tasks.filter((t) => !t.done).length;

  const byStage = OPEN_STAGES.map((stage) => {
    const ds = openDeals.filter((d) => d.stage === stage);
    return { stage, count: ds.length, value: ds.reduce((s, d) => s + d.value, 0) };
  });
  const maxStageValue = Math.max(...byStage.map((s) => s.value), 1);

  const series = SERIES[metric];
  const latest = series.points[series.points.length - 1];
  const prev = series.points[series.points.length - 2];
  const changePct = Math.round(((latest - prev) / prev) * 100);
  const headline = metric === "revenue" ? money(latest * 1000) : String(latest);

  const metrics = [
    { label: "Pipeline value", value: money(pipelineValue), delta: { value: "12% MoM", direction: "up" as const } },
    { label: "Won · MTD", value: money(wonValue), delta: { value: `${wonCount} deals`, direction: "up" as const } },
    { label: "Win rate", value: `${winRate}%`, delta: { value: "4 pts", direction: "up" as const } },
    { label: "Open tasks", value: String(openTaskCount), delta: { value: "2 due today", direction: "flat" as const } },
  ];

  const topDeals = [...openDeals].sort((a, b) => b.value - a.value).slice(0, 6);

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function createDeal(e: React.FormEvent) {
    e.preventDefault();
    setCreateOpen(false);
    toast.success("Deal created", { description: "Added to your pipeline (demo)." });
  }

  return (
    <>
      <AppTopbar title="Dashboard">
        <Select defaultValue="30d">
          <SelectTrigger size="sm" className="hidden w-[150px] sm:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="qtd">Quarter to date</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              New deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={createDeal}>
              <DialogHeader>
                <DialogTitle>New deal</DialogTitle>
                <DialogDescription>Add an opportunity to your pipeline.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="deal-name">Deal name</Label>
                  <Input id="deal-name" autoFocus placeholder="Acme — Platform expansion" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="deal-company">Company</Label>
                    <Select defaultValue={COMPANIES[0].name}>
                      <SelectTrigger id="deal-company" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANIES.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="deal-value">Value (USD)</Label>
                    <Input id="deal-value" type="number" placeholder="25000" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="deal-stage">Stage</Label>
                  <Select defaultValue="lead">
                    <SelectTrigger id="deal-stage" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPEN_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STAGE_META[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Create deal</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppTopbar>

      <div className="flex flex-col gap-6 p-6">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <StatCard key={m.label} label={m.label} value={m.value} delta={m.delta} />
          ))}
        </div>

        {/* Performance + pipeline */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    {series.label} · last 8 months
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-2xl font-medium tabular-nums">{headline}</span>
                    <span className="inline-flex items-center gap-0.5 font-mono text-xs text-[#1B8A5B]">
                      <TrendingUp className="size-3.5" />
                      {changePct}%
                    </span>
                  </div>
                </div>
                <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
                  <TabsList variant="line">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="deals">Deals</TabsTrigger>
                    <TabsTrigger value="leads">Leads</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <BarChart points={series.points} labels={MONTHS} />
            </div>
          </Card>

          <Card>
            <div className="border-b p-5">
              <h2 className="text-sm font-semibold">Pipeline by stage</h2>
              <p className="text-xs text-muted-foreground">{money(pipelineValue)} across {openDeals.length} open deals</p>
            </div>
            <div className="flex flex-col gap-3.5 p-5">
              {byStage.map((s) => (
                <div key={s.stage} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Dot color={STAGE_META[s.stage].dot} />
                      {STAGE_META[s.stage].label}
                      <span className="text-muted-foreground">· {s.count}</span>
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">{money(s.value)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.value / maxStageValue) * 100}%`, background: STAGE_META[s.stage].dot }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Open deals + tasks/activity */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between p-5">
              <div>
                <h2 className="text-sm font-semibold">Open deals</h2>
                <p className="text-xs text-muted-foreground">Top opportunities by value</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href="/deals">
                  View pipeline
                  <ArrowUpRight />
                </a>
              </Button>
            </div>
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="hidden md:table-cell">Close</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDeals.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{d.name}</span>
                          <span className="text-xs text-muted-foreground">{d.company}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StageBadge stage={d.stage} />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{money(d.value)}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{d.closeDate}</TableCell>
                      <TableCell>
                        <Initials initials={d.ownerInitials} size={6} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card>
            <Tabs defaultValue="tasks" className="gap-0">
              <div className="flex items-center justify-between border-b p-3 pl-5">
                <h2 className="text-sm font-semibold">My day</h2>
                <TabsList>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tasks" className="flex flex-col">
                {tasks.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-start gap-3 border-b px-5 py-3 last:border-0 hover:bg-muted/40"
                  >
                    <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} className="mt-0.5" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={t.done ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                        {t.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{t.due}</span>
                        <span aria-hidden>·</span>
                        <PriorityFlag priority={t.priority} />
                      </div>
                    </div>
                  </label>
                ))}
              </TabsContent>

              <TabsContent value="activity" className="flex flex-col">
                {ACTIVITIES.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 border-b px-5 py-3 last:border-0">
                    <ActivityIcon kind={a.kind} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm">{a.title}</span>
                      <span className="text-xs text-muted-foreground">{a.time}</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </>
  );
}
