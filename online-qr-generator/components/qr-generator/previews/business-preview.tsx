"use client";

import { BusinessPublicPage } from "@/components/qr-public/business-public-page";
import { previewResolver } from "@/components/qr-public/resolver";
import type { BusinessContent } from "@/lib/qr/types";

export function BusinessPreview({ data }: { data: BusinessContent }) {
  return <BusinessPublicPage data={data} resolveAsset={previewResolver} />;
}
