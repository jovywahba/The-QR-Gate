"use client";

import { MenuPublicPage } from "@/components/qr-public/menu-public-page";
import { previewResolver } from "@/components/qr-public/resolver";
import type { MenuContent } from "@/lib/qr/types";

export function MenuPreview({ data }: { data: MenuContent }) {
  return <MenuPublicPage data={data} resolveAsset={previewResolver} />;
}
