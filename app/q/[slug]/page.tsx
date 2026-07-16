import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HalfstackEndorser } from "@/components/brand/logo";
import { PublicQRRenderer } from "@/components/qr-public/public-qr-renderer";
import type { PublicAssetRow } from "@/components/qr-public/resolver";
import { isQRType } from "@/lib/qr/registry";
import { isValidSlug } from "@/lib/qr/slug";
import type { QRContent } from "@/lib/qr/types";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * The public destination behind every hosted QR. Data comes ONLY
 * through get_public_qr() — a security-definer function that returns
 * published records with safe fields; drafts and archived records
 * are invisible (notFound), and no table is exposed to anon selects.
 */

type PublicQR = {
  slug: string;
  type: string;
  name: string | null;
  content: QRContent;
  published_at: string;
  assets: PublicAssetRow[];
};

async function fetchPublicQR(slug: string): Promise<PublicQR | null> {
  if (!isValidSlug(slug)) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_qr", { p_slug: slug });
    if (error || !data) return null;
    const record = data as PublicQR;
    if (!isQRType(record.type) || !record.content?.type) return null;
    return record;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const record = await fetchPublicQR(slug);
  if (!record) return { title: "Not found" };
  return {
    title: record.name ?? site.name,
    description: `Shared with ${site.name}.`,
    robots: { index: false }, // user content pages aren't part of our SEO surface
  };
}

export default async function PublicQRPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await fetchPublicQR(slug);
  if (!record) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <PublicQRRenderer content={record.content} assets={record.assets} />
      </main>
      <footer className="border-t bg-card py-4">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-1.5 px-4 text-center">
          <Link href="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Made with {site.name} — create your own QR code
          </Link>
          <HalfstackEndorser />
        </div>
      </footer>
    </div>
  );
}
