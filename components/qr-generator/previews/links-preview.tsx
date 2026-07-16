"use client";

import { LinksPublicPage } from "@/components/qr-public/links-public-page";
import { previewResolver } from "@/components/qr-public/resolver";
import type { LinksContent } from "@/lib/qr/types";

export function LinksPreview({ data }: { data: LinksContent }) {
  return <LinksPublicPage data={data} resolveAsset={previewResolver} />;
}
