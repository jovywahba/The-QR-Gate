import type { Metadata } from "next";
import Link from "next/link";
import { docs } from "@/lib/content";

export const metadata: Metadata = { title: "Docs", description: "Guides and help." };

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="font-mono text-xs uppercase tracking-wider text-accent">Docs</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Help center</h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {docs.map((d) => (
          <Link
            key={d.slug}
            href={`/docs/${d.slug}`}
            className="group rounded-xl border bg-card p-5 transition-colors hover:border-accent/40"
          >
            <div className="font-medium group-hover:text-accent">{d.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{d.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
