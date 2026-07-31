import type { Metadata } from "next";
import Link from "next/link";
import { Check, Search, ShieldCheck, X } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { AdminSection, MigrationRequired } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminGlobalSearch } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Support Center" };

/** Things support may safely do — the workflow always starts from a search. */
const CAN_DO = [
  "View safe account details",
  "View a user's QR records",
  "Send a password-reset email",
  "Add internal support notes",
];

/** The explicit ceiling, stated plainly so nobody expects more. */
const CANNOT_DO =
  "Support cannot: suspend users, change billing, grant Pro, change roles, or see passwords, tokens, WiFi passwords, or private QR content.";

function meta(...parts: (string | null)[]): string {
  return parts.map((p) => (p && p.trim() ? p : null)).filter(Boolean).join(" · ");
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin("view_support");
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();
  const results = query ? await adminGlobalSearch(supabase, query) : null;

  return (
    <>
      <AdminTopbar title="Support Center" />
      <div className="flex flex-col gap-6 p-6">
        <form action="/admin/support" method="get" className="flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search by email, name, user ID, QR name or slug"
              aria-label="Search users and QR codes"
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {results === null ? (
          <AdminSection
            title="What support can do"
            description="Support is a read-first, fully audited workflow. Search above to begin."
          >
            <ul className="flex flex-col gap-2.5">
              {CAN_DO.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 flex-none text-[#1B8A5B]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-start gap-2.5 border-t pt-4 text-sm text-muted-foreground">
              <X className="mt-0.5 size-4 flex-none" aria-hidden />
              <p>{CANNOT_DO}</p>
            </div>
          </AdminSection>
        ) : !results.available ? (
          <MigrationRequired what="Support search" />
        ) : (
          <>
            <AdminSection
              title="Users"
              description={`Matches for “${query}”`}
            >
              {results.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching users.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {results.users.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{u.email ?? "—"}</span>
                          {u.suspended && (
                            <Badge
                              variant="outline"
                              className="flex-none border-destructive/40 font-mono text-[10px] uppercase text-destructive"
                            >
                              Suspended
                            </Badge>
                          )}
                        </div>
                        {u.fullName && (
                          <p className="truncate text-xs text-muted-foreground">{u.fullName}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild className="flex-none">
                        <Link href={`/admin/users/${u.id}`}>Open</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSection>

            <AdminSection title="QR codes" description={`Matches for “${query}”`}>
              {results.qrs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching QR codes.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {results.qrs.map((qr) => (
                    <li
                      key={qr.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{qr.name || "Untitled QR"}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {meta(qr.slug, qr.type, qr.status) || "—"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild className="flex-none">
                        <Link href="/admin/qr-codes">Open QR admin</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSection>
          </>
        )}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 flex-none" aria-hidden />
          Support actions are performed from the linked user&rsquo;s detail page and are always audited.
        </p>
      </div>
    </>
  );
}
