"use client";

import { Plus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { AppTopbar } from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DEALS, STAGE_META, money, type DealStage } from "../_demo/data";
import { StageBadge, Initials, Dot } from "../_demo/widgets";

const BOARD: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won"];

export default function DealsPage() {
  const open = DEALS.filter((d) => !["won", "lost"].includes(d.stage));
  const totalOpen = open.reduce((s, d) => s + d.value, 0);
  const weighted = open.reduce((s, d) => s + (d.value * d.probability) / 100, 0);

  return (
    <>
      <AppTopbar title="Deals">
        <Button size="sm" onClick={() => toast.success("Deal created (demo)")}>
          <Plus />
          New deal
        </Button>
      </AppTopbar>

      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">Open pipeline</div>
            <div className="font-mono text-xl font-medium tabular-nums">{money(totalOpen)}</div>
          </div>
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">Weighted</div>
            <div className="font-mono text-xl font-medium tabular-nums">{money(weighted)}</div>
          </div>
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">Open deals</div>
            <div className="font-mono text-xl font-medium tabular-nums">{open.length}</div>
          </div>
        </div>

        <Tabs defaultValue="board" className="gap-4">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>

          {/* Kanban board */}
          <TabsContent value="board">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {BOARD.map((stage) => {
                const deals = DEALS.filter((d) => d.stage === stage);
                const total = deals.reduce((s, d) => s + d.value, 0);
                return (
                  <div key={stage} className="flex w-72 shrink-0 flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                        <Dot color={STAGE_META[stage].dot} />
                        {STAGE_META[stage].label}
                        <span className="text-muted-foreground">{deals.length}</span>
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">{money(total)}</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {deals.map((d) => (
                        <Card key={d.id} className="cursor-grab p-3 transition-colors hover:border-foreground/20">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-snug">{d.name}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="-mt-1 -mr-1 size-6 shrink-0"
                                  aria-label="Deal actions"
                                >
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={() => toast(`Opening ${d.name}`)}>Open</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast("Marked won (demo)")}>Mark won</DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => toast.error("Marked lost")}>
                                  Mark lost
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{d.company}</div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-mono text-sm font-medium tabular-nums">{money(d.value)}</span>
                            <Initials initials={d.ownerInitials} size={6} />
                          </div>

                          <div className="mt-2.5 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${d.probability}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">{d.probability}%</span>
                          </div>
                          <div className="mt-2 text-[11px] text-muted-foreground">Closes {d.closeDate}</div>
                        </Card>
                      ))}
                      {deals.length === 0 ? (
                        <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                          No deals
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Table view */}
          <TabsContent value="table">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Probability</TableHead>
                    <TableHead className="hidden lg:table-cell">Close</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEALS.map((d) => (
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
                      <TableCell className="hidden text-right font-mono tabular-nums text-muted-foreground md:table-cell">
                        {d.probability}%
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{d.closeDate}</TableCell>
                      <TableCell>
                        <Initials initials={d.ownerInitials} size={6} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
