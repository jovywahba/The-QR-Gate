"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Mail, Phone, CalendarPlus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { AppTopbar } from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CONTACTS, CONTACT_STATUS_META, type ContactStatus } from "../_demo/data";
import { StatusBadge, Initials } from "../_demo/widgets";

type Tab = "all" | ContactStatus;
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lead", label: "Leads" },
  { value: "qualified", label: "Qualified" },
  { value: "customer", label: "Customers" },
  { value: "churned", label: "Churned" },
];

export default function ContactsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const rows = CONTACTS.filter((c) => (tab === "all" ? true : c.status === tab)).filter((c) =>
    `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function addContact(e: React.FormEvent) {
    e.preventDefault();
    setCreateOpen(false);
    toast.success("Contact added", { description: "Saved to your CRM (demo)." });
  }

  return (
    <>
      <AppTopbar title="Contacts">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Add contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={addContact}>
              <DialogHeader>
                <DialogTitle>Add contact</DialogTitle>
                <DialogDescription>Create a new person in your CRM.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-name">Full name</Label>
                    <Input id="c-name" autoFocus placeholder="Jane Doe" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-title">Title</Label>
                    <Input id="c-title" placeholder="VP Sales" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" type="email" placeholder="jane@company.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-company">Company</Label>
                    <Input id="c-company" placeholder="Company" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-status">Status</Label>
                    <Select defaultValue="lead">
                      <SelectTrigger id="c-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CONTACT_STATUS_META) as ContactStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {CONTACT_STATUS_META[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Add contact</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppTopbar>

      <div className="p-6">
        <Card>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList variant="line">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts…"
                className="h-8 w-full pl-8"
              />
            </div>
          </div>

          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">Last activity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Initials initials={c.initials} size={8} />
                        <div className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{c.title}</TableCell>
                    <TableCell>{c.company}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{c.owner}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{c.lastActivity}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" aria-label="Contact actions">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>{c.name}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => toast(`Emailing ${c.name}`)}>
                            <Mail />
                            Send email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast(`Calling ${c.name}`)}>
                            <Phone />
                            Log call
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast("Task scheduled")}>
                            <CalendarPlus />
                            Add task
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

          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing <span className="font-mono">{rows.length}</span> of{" "}
              <span className="font-mono">{CONTACTS.length}</span> contacts
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7" disabled>
                <ChevronLeft />
                Prev
              </Button>
              <Button variant="outline" size="sm" className="h-7" disabled>
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
