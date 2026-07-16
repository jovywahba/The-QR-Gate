"use client";

import { useState, type ReactNode } from "react";
import { Upload, Shield, Monitor, Smartphone, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppTopbar } from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MEMBERS = [
  { id: "u1", name: "You", email: "demo@tryhalfstack.com", initials: "YO", role: "Owner", status: "active" },
  { id: "u2", name: "Dana Kim", email: "dana@acme.com", initials: "DK", role: "Admin", status: "active" },
  { id: "u3", name: "Marco Toledo", email: "marco@acme.com", initials: "MT", role: "Member", status: "active" },
  { id: "u4", name: "Priya Shah", email: "priya@acme.com", initials: "PS", role: "Member", status: "invited" },
];

const SESSIONS = [
  { id: "s1", device: "MacBook Pro · Chrome", location: "San Francisco, US", last: "Active now", current: true, icon: Monitor },
  { id: "s2", device: "iPhone 15 · Safari", location: "San Francisco, US", last: "2 hours ago", current: false, icon: Smartphone },
  { id: "s3", device: "Windows · Edge", location: "Austin, US", last: "3 days ago", current: false, icon: Monitor },
];

function SettingsCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-1 border-b p-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3">{footer}</div>
      ) : null}
    </Card>
  );
}

function ToggleRow({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

const saved = () => toast.success("Changes saved");

export default function SettingsPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <AppTopbar title="Settings" />

      <div className="mx-auto max-w-3xl p-6">
        <Tabs defaultValue="profile" className="gap-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile">
            <SettingsCard
              title="Your profile"
              description="How you appear across the workspace."
              footer={<Button size="sm" onClick={saved}>Save changes</Button>}
            >
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground">
                      YO
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast("Upload a photo (demo)")}>
                      <Upload />
                      Upload
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toast("Photo removed")}>
                      Remove
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-name">Full name</Label>
                    <Input id="p-name" defaultValue="You" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-title">Job title</Label>
                    <Input id="p-title" defaultValue="Account Executive" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-email">Email</Label>
                    <Input id="p-email" type="email" defaultValue="demo@tryhalfstack.com" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-tz">Timezone</Label>
                    <Select defaultValue="pt">
                      <SelectTrigger id="p-tz" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">Pacific (PT)</SelectItem>
                        <SelectItem value="mt">Mountain (MT)</SelectItem>
                        <SelectItem value="ct">Central (CT)</SelectItem>
                        <SelectItem value="et">Eastern (ET)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </SettingsCard>
          </TabsContent>

          {/* WORKSPACE */}
          <TabsContent value="workspace">
            <SettingsCard
              title="Workspace"
              description="Settings that apply to everyone in this workspace."
              footer={<Button size="sm" onClick={saved}>Save changes</Button>}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="w-name">Workspace name</Label>
                  <Input id="w-name" defaultValue="Acme" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="w-url">Workspace URL</Label>
                  <div className="flex items-center rounded-md border border-input pl-3 text-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                    <span className="font-mono text-muted-foreground">acme.app/</span>
                    <Input
                      id="w-url"
                      defaultValue="team"
                      className="border-0 pl-0.5 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="w-industry">Industry</Label>
                  <Select defaultValue="saas">
                    <SelectTrigger id="w-industry" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">Software / SaaS</SelectItem>
                      <SelectItem value="fin">Finance</SelectItem>
                      <SelectItem value="health">Healthcare</SelectItem>
                      <SelectItem value="mfg">Manufacturing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="w-currency">Default currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger id="w-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SettingsCard>
          </TabsContent>

          {/* MEMBERS */}
          <TabsContent value="members">
            <Card>
              <div className="flex items-center justify-between border-b p-5">
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-semibold">Team members</h2>
                  <p className="text-xs text-muted-foreground">{MEMBERS.length} people in this workspace</p>
                </div>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setInviteOpen(false);
                        toast.success("Invitation sent");
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>Invite teammates</DialogTitle>
                        <DialogDescription>They’ll get an email to join this workspace.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="inv-email">Email addresses</Label>
                          <Input id="inv-email" autoFocus placeholder="teammate@company.com" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="inv-role">Role</Label>
                          <Select defaultValue="member">
                            <SelectTrigger id="inv-role" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
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
                        <Button type="submit">Send invites</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MEMBERS.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-secondary text-[11px] font-medium text-secondary-foreground">
                              {m.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-xs text-muted-foreground">{m.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {m.role === "Owner" ? (
                          <span className="text-sm text-muted-foreground">Owner</span>
                        ) : (
                          <Select defaultValue={m.role.toLowerCase()}>
                            <SelectTrigger size="sm" className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.status === "active" ? "secondary" : "outline"} className="font-normal">
                          {m.status === "active" ? "Active" : "Invited"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7" aria-label="Member actions" disabled={m.role === "Owner"}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => toast(`Resent invite to ${m.name}`)}>
                              Resend invite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => toast.error(`Removed ${m.name}`)}>
                              <Trash2 />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications">
            <div className="flex flex-col gap-4">
              <SettingsCard title="Email notifications" description="Sent to demo@tryhalfstack.com.">
                <div className="flex flex-col divide-y">
                  <ToggleRow title="New lead assigned" description="When a lead is routed to you." defaultChecked />
                  <ToggleRow title="Deal stage changes" description="When a deal you own moves stage." defaultChecked />
                  <ToggleRow title="Mentions & comments" description="When someone @mentions you." defaultChecked />
                  <ToggleRow title="Weekly digest" description="A Monday summary of your pipeline." />
                </div>
              </SettingsCard>
              <SettingsCard title="In-product" description="Alerts inside the app.">
                <div className="flex flex-col divide-y">
                  <ToggleRow title="Desktop notifications" description="Browser push for time-sensitive events." defaultChecked />
                  <ToggleRow title="Sound" description="Play a sound for new activity." />
                </div>
              </SettingsCard>
            </div>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security">
            <div className="flex flex-col gap-4">
              <SettingsCard
                title="Password"
                description="Use a strong, unique password."
                footer={<Button size="sm" onClick={() => toast.success("Password updated")}>Update password</Button>}
              >
                <div className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="cur-pw">Current password</Label>
                    <Input id="cur-pw" type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-pw">New password</Label>
                      <Input id="new-pw" type="password" placeholder="••••••••" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="conf-pw">Confirm</Label>
                      <Input id="conf-pw" type="password" placeholder="••••••••" />
                    </div>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard title="Two-factor authentication" description="Add a second step at sign-in.">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                      <Shield className="size-4" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">Authenticator app</span>
                      <span className="text-xs text-muted-foreground">Not configured</span>
                    </div>
                  </div>
                  <Switch onCheckedChange={(v) => toast(v ? "Set up 2FA (demo)" : "2FA disabled")} />
                </div>
              </SettingsCard>

              <SettingsCard title="Active sessions" description="Devices currently signed in.">
                <div className="flex flex-col divide-y">
                  {SESSIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                            <Icon className="size-4" />
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              {s.device}
                              {s.current ? (
                                <Badge variant="accent" className="font-normal">
                                  This device
                                </Badge>
                              ) : null}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {s.location} · {s.last}
                            </span>
                          </div>
                        </div>
                        {!s.current ? (
                          <Button variant="ghost" size="sm" onClick={() => toast.success("Session revoked")}>
                            Revoke
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </SettingsCard>

              {/* Danger zone */}
              <Card className="border-destructive/30">
                <div className="flex flex-col gap-1 border-b border-destructive/30 p-5">
                  <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
                  <p className="text-xs text-muted-foreground">Irreversible account actions.</p>
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Delete account</span>
                    <span className="text-xs text-muted-foreground">
                      Permanently delete your account and all data.
                    </span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes your account, workspace data, and billing. This
                          can’t be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => toast.error("Account deletion requested")}>
                          Delete account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
