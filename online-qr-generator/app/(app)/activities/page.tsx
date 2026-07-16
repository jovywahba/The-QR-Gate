"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AppTopbar } from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { ACTIVITIES, TASKS, type ActivityKind } from "../_demo/data";
import { ActivityIcon, Initials, PriorityFlag } from "../_demo/widgets";

type Tab = "all" | ActivityKind;
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "call", label: "Calls" },
  { value: "email", label: "Emails" },
  { value: "meeting", label: "Meetings" },
  { value: "note", label: "Notes" },
];

export default function ActivitiesPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [tasks, setTasks] = useState(TASKS);
  const [logOpen, setLogOpen] = useState(false);

  const feed = ACTIVITIES.filter((a) => (tab === "all" ? true : a.kind === tab));

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function logActivity(e: React.FormEvent) {
    e.preventDefault();
    setLogOpen(false);
    toast.success("Activity logged", { description: "Added to the timeline (demo)." });
  }

  return (
    <>
      <AppTopbar title="Activities">
        <Dialog open={logOpen} onOpenChange={setLogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Log activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={logActivity}>
              <DialogHeader>
                <DialogTitle>Log activity</DialogTitle>
                <DialogDescription>Record a call, email, meeting, or note.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="a-type">Type</Label>
                    <Select defaultValue="call">
                      <SelectTrigger id="a-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="a-related">Related to</Label>
                    <Input id="a-related" placeholder="Contact or company" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="a-note">Notes</Label>
                  <Textarea id="a-note" rows={3} placeholder="What happened?" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Log activity</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppTopbar>

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Timeline */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">Activity timeline</h2>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList variant="line">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <ol className="flex flex-col p-5">
            {feed.map((a, i) => (
              <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
                {i < feed.length - 1 ? (
                  <span className="absolute top-8 left-3.5 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-border" />
                ) : null}
                <ActivityIcon kind={a.kind} className="relative z-10" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                  <span className="text-sm">{a.title}</span>
                  <span className="text-xs text-muted-foreground">{a.meta}</span>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Initials initials={a.whoInitials} size={5} />
                    <span>{a.who}</span>
                    <span aria-hidden>·</span>
                    <span>{a.time}</span>
                  </div>
                </div>
              </li>
            ))}
            {feed.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted-foreground">No activity of this type.</li>
            ) : null}
          </ol>
        </Card>

        {/* Tasks */}
        <Card className="self-start">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-sm font-semibold">Tasks</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {tasks.filter((t) => !t.done).length} open
            </span>
          </div>
          <div className="flex flex-col">
            {tasks.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/40"
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
          </div>
          <div className="p-3">
            <Button variant="outline" size="sm" className="w-full" onClick={() => toast("Add task (demo)")}>
              <Plus />
              Add task
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
