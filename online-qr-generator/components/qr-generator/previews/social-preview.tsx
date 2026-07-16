"use client";

import { previewResolver } from "@/components/qr-public/resolver";
import { SocialPublicPage } from "@/components/qr-public/social-public-page";
import type { SocialContent } from "@/lib/qr/types";

export function SocialPreview({ data }: { data: SocialContent }) {
  return <SocialPublicPage data={data} resolveAsset={previewResolver} />;
}
