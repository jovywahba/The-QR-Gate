"use client";

import { AppsPublicPage } from "@/components/qr-public/apps-public-page";
import { previewResolver } from "@/components/qr-public/resolver";
import type { AppsContent } from "@/lib/qr/types";

export function AppsPreview({ data }: { data: AppsContent }) {
  return <AppsPublicPage data={data} resolveAsset={previewResolver} />;
}
