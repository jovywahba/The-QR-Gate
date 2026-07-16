import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { posts, docs } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const staticPaths = [
    "",
    "/create",
    "/pricing",
    "/about",
    "/status",
    "/blog",
    "/docs",
    "/terms",
    "/privacy",
  ];

  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const })),
    ...site.alternatives.map((a) => ({ url: `${base}/alternatives/${a.slug}` })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.date })),
    ...docs.map((d) => ({ url: `${base}/docs/${d.slug}` })),
  ];
}
