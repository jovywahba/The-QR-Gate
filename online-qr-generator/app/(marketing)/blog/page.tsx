import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/lib/content";

export const metadata: Metadata = { title: "Blog", description: "Notes, updates, and guides." };

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="font-mono text-xs uppercase tracking-wider text-accent">Blog</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Writing</h1>
      <div className="mt-10 flex flex-col divide-y">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex flex-col gap-1 py-5">
            <span className="font-mono text-xs text-muted-foreground">{p.date}</span>
            <span className="text-lg font-medium group-hover:text-accent">{p.title}</span>
            <span className="text-sm text-muted-foreground">{p.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
