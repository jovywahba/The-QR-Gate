import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listAdminUsers, type AdminUserFilter } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

const FILTERS: { key: AdminUserFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "free", label: "Free" },
  { key: "pro", label: "Pro" },
  { key: "suspended", label: "Suspended" },
  { key: "new", label: "New This Month" },
  { key: "over_limit", label: "Over Free Limit" },
];

function initials(name: string | null, email: string | null): string {
  const base = name || email || "?";
  const parts = base.trim().split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
function date(v: string | null): string {
  return v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}
function ago(v: string | null): string {
  if (!v) return "Never";
  const mins = Math.floor((Date.now() - new Date(v).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date(v);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  await requireAdmin("view_users");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const filter = (FILTERS.find((f) => f.key === params.filter)?.key ?? "all") as AdminUserFilter;

  const supabase = await createClient();
  const { available, rows } = await listAdminUsers(supabase, { search: q, filter, limit: 100 });

  const withParams = (patch: { q?: string; filter?: string }) => {
    const sp = new URLSearchParams();
    const nq = patch.q ?? (q || undefined);
    const nf = patch.filter ?? (filter === "all" ? undefined : filter);
    if (nq) sp.set("q", nq);
    if (nf) sp.set("filter", nf);
    const s = sp.toString();
    return s ? `/admin/users?${s}` : "/admin/users";
  };

  return (
    <>
      <AdminTopbar title="Users" />
      <div className="space-y-4 p-6">
        {!available ? (
          <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
            Apply the admin migration to load users.
          </div>
        ) : (
          <>
            <form method="get" className="relative max-w-sm">
              {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input name="q" defaultValue={q} placeholder="Search name, email, or user ID…" aria-label="Search users" className="pl-9" />
            </form>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter users">
              {FILTERS.map((f) => (
                <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" asChild>
                  <Link href={withParams({ filter: f.key === "all" ? undefined : f.key })}>{f.label}</Link>
                </Button>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                {q ? `No users match “${q}”.` : "No users found."}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden text-right md:table-cell">QRs</TableHead>
                      <TableHead className="hidden lg:table-cell">Last active</TableHead>
                      <TableHead className="hidden lg:table-cell">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((u) => (
                      <TableRow key={u.id} className="cursor-pointer">
                        <TableCell>
                          <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                            <Avatar className="size-8">
                              {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
                              <AvatarFallback className="bg-secondary text-[11px] font-semibold">
                                {initials(u.fullName, u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{u.fullName || "—"}</span>
                              <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] uppercase">
                            {u.isPro ? "Pro" : "Free"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.suspended ? (
                            <Badge variant="outline" className="border-destructive/40 font-mono text-[10px] uppercase text-destructive">
                              Suspended
                            </Badge>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <span className={cn("size-1.5 rounded-full", u.online ? "bg-[#1B8A5B]" : "bg-muted-foreground/40")} />
                              {u.online ? "Online" : "Offline"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-right font-mono text-sm tabular-nums md:table-cell">
                          {u.qrActive}
                          <span className="text-muted-foreground"> / {u.qrTotal}</span>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                          {ago(u.lastSeenAt)}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                          {date(u.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
