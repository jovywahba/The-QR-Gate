"use client";

import { PdfPublicPage } from "@/components/qr-public/pdf-public-page";
import { previewResolver } from "@/components/qr-public/resolver";
import type { PDFContent } from "@/lib/qr/types";

/** Live preview = the same component the published page renders. */
export function PdfPreview({ data }: { data: PDFContent }) {
  return <PdfPublicPage data={data} resolveAsset={previewResolver} />;
}
