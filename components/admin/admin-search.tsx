"use client";

import * as React from "react";
import Link from "next/link";
import { QrCode, Search, User as UserIcon } from "lucide-react";
import { runAdminSearch, type AdminSearchResult } from "@/app/(admin)/admin/search-action";
import { cn } from "@/lib/utils";

/**
 * Admin global search. Debounced live lookup through the permission-aware
 * server action (the DB only returns records the caller's role may see).
 * Rendered in the shell only for roles that hold `global_search`.
 */
export function AdminGlobalSearch({ className }: { className?: string }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [res, setRes] = React.useState<AdminSearchResult>({ ok: true, users: [], qrs: [] });
  const [pending, startTransition] = React.useTransition();
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes({ ok: true, users: [], qrs: [] });
      return;
    }
    const t = window.setTimeout(() => {
      startTransition(async () => {
        const r = await runAdminSearch(term);
        setRes(r);
        setOpen(true);
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const has = res.users.length > 0 || res.qrs.length > 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="flex items-center gap-2 rounded-md border bg-background px-2.5">
        <Search className="size-3.5 flex-none text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search users, QR codes…"
          aria-label="Admin global search"
          className="h-8 w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
          {pending && <p className="px-2 py-3 text-xs text-muted-foreground">Searching…</p>}
          {!pending && !res.ok && (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Search isn&apos;t available (needs migration 0006, or your role can&apos;t search).
            </p>
          )}
          {!pending && res.ok && !has && (
            <p className="px-2 py-3 text-xs text-muted-foreground">No matches.</p>
          )}

          {res.users.length > 0 && (
            <div className="mb-1">
              <p className="px-2 pt-1.5 pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Users
              </p>
              {res.users.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/10"
                >
                  <UserIcon className="size-3.5 flex-none text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{u.email ?? u.fullName ?? u.id}</span>
                  {u.suspended && (
                    <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                      Suspended
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {res.qrs.length > 0 && (
            <div>
              <p className="px-2 pt-1.5 pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                QR codes
              </p>
              {res.qrs.map((r) => (
                <Link
                  key={r.id}
                  href={`/admin/qr-codes/${r.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/10"
                >
                  <QrCode className="size-3.5 flex-none text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{r.name ?? r.slug ?? r.id}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{r.type}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
