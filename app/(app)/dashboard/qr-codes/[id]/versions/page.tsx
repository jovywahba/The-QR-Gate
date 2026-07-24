import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History, RotateCcw } from "lucide-react";
import { AppTopbar } from "@/components/app/app-topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Version history" };

type Version = {
  id: string;
  version: number;
  destination_url: string | null;
  created_at: string;
  content: { type?: string } | null;
};

function when(v: string): string {
  return new Date(v).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
function dest(v: Version): string {
  if (v.destination_url) return v.destination_url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return "—";
}

export default async function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  // RLS: only the owner's row + versions come back.
  const { data: qr } = await supabase.from("qr_codes").select("id, name, type").eq("id", id).maybeSingle();
  if (!qr) notFound();

  const { data: versionsRaw } = await supabase
    .from("qr_versions")
    .select("id, version, destination_url, created_at, content")
    .eq("qr_code_id", id)
    .order("version", { ascending: false });
  const versions = (versionsRaw ?? []) as Version[];
  const typeName = isQRType(qr.type) ? getQRType(qr.type).name : qr.type;

  return (
    <>
      <AppTopbar title="Version history">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/qr-codes">
            <ArrowLeft aria-hidden />
            Back
          </Link>
        </Button>
      </AppTopbar>

      <div className="flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">{qr.name || "Untitled QR"}</h2>
          <p className="text-sm text-muted-foreground">{typeName} · a snapshot is saved each time you publish</p>
        </div>

        {versions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-12 text-center">
            <History className="size-8 text-muted-foreground/60" aria-hidden />
            <p className="text-sm text-muted-foreground">
              No versions yet. Publish this QR code to start its history.
            </p>
          </div>
        ) : (
          <ol className="overflow-hidden rounded-lg border bg-card">
            {versions.map((v, i) => (
              <li key={v.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 ${i > 0 ? "border-t" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 flex-none items-center justify-center rounded-md bg-secondary font-mono text-xs font-medium">
                    v{v.version}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Version {v.version}</span>
                      {i === 0 ? (
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          Latest
                        </Badge>
                      ) : null}
                    </div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {when(v.created_at)} · {dest(v)}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/create?id=${id}&step=2&version=${v.id}`}>
                    <RotateCcw aria-hidden />
                    Restore
                  </Link>
                </Button>
              </li>
            ))}
          </ol>
        )}

        <p className="text-xs text-muted-foreground">
          Restoring loads that version into the editor as unpublished changes — your live page keeps
          showing the current version until you review and publish. Restoring never changes the QR’s
          link or its collected analytics.
        </p>
      </div>
    </>
  );
}
