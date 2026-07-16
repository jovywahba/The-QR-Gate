"use client";

import { ImagesPublicPage } from "@/components/qr-public/images-public-page";
import { previewResolver } from "@/components/qr-public/resolver";
import type { ImagesContent } from "@/lib/qr/types";

export function ImagesPreview({ data }: { data: ImagesContent }) {
  return <ImagesPublicPage data={data} resolveAsset={previewResolver} />;
}
