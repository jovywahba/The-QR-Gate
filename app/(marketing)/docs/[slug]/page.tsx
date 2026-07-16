import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docs, getDoc } from "@/lib/content";

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};
  return { title: doc.title, description: doc.description };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">{doc.title}</h1>
      <p className="mt-2 text-muted-foreground">{doc.description}</p>
      <div className="mt-8 flex flex-col gap-4 leading-relaxed text-muted-foreground">
        {doc.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
