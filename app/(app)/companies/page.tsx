"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, ExternalLink, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppTopbar } from "@/components/app/app-topbar";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { COMPANIES, money, type Health } from "../_demo/data";
import { HealthBadge } from "../_demo/widgets";

export default function CompaniesPage() {
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<"all" | Health>("all");

  const rows = COMPANIES.filter((c) => (health === "all" ? true : c.health === health)).filter((c) =>
    `${c.name} ${c.industry} ${c.location}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const totalArr = COMPANIES.reduce((s, c) => s + c.arr, 0);
  const atRisk = COMPANIES.filter((c) => c.health === "at_risk").length;

  const stats = [
    { label: "Total ARR", value: money(totalArr), delta: { value: "9% YoY", direction: "up" as const } },
    { label: "Accounts", value: String(COMPANIES.length), delta: { value: "2 new", direction: "up" as const } },
    { label: "At risk", value: String(atRisk), delta: { value: "needs attention", direction: "flat" as const } },
  ];

  return (
    <>
      <AppTopbar title="Companies">
        <Button size="sm" onClick={() => toast.success("Company added (demo)")}>
          <Plus />
          Add company
        </Button>
      </AppTopbar>

      <div className="flex flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} />
          ))}
        </div>

        <Card>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Accounts</h2>
              <p className="text-xs text-muted-foreground">All companies in your workspace</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search companies…"
                  className="h-8 w-full pl-8"
                />
              </div>
              <Select value={health} onValueChange={(v) => setHealth(v as "all" | Health)}>
                <SelectTrigger size="sm" className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All health</SelectItem>
                  <SelectItem value="good">Healthy</SelectItem>
                  <SelectItem value="watch">Watch</SelectItem>
                  <SelectItem value="at_risk">At risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden md:table-cell">Industry</TableHead>
                  <TableHead className="hidden lg:table-cell">Size</TableHead>
                  <TableHead className="hidden xl:table-cell">Location</TableHead>
                  <TableHead className="text-center">Deals</TableHead>
                  <TableHead className="text-right">ARR</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                          {c.name.charAt(0)}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{c.domain}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{c.industry}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{c.size}</TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{c.location}</TableCell>
                    <TableCell className="text-center font-mono tabular-nums">{c.openDeals}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {c.arr ? money(c.arr) : "—"}
                    </TableCell>
                    <TableCell>
                      <HealthBadge health={c.health} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" aria-label="Company actions">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel>{c.name}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => toast(`Opening ${c.domain}`)}>
                            <ExternalLink />
                            Visit site
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast("New deal (demo)")}>
                            <Target />
                            New deal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => toast.error(`Deleted ${c.name}`)}>
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </>
  );
}
