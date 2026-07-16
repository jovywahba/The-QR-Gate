import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { posts, getPost } from "@/lib/content";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-20">
      <span className="font-mono text-xs text-muted-foreground">{post.date}</span>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{post.title}</h1>
      <div className="mt-8 flex flex-col gap-4 leading-relaxed text-muted-foreground">
        {post.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
