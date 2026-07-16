import { Download, FileText } from "lucide-react";
import type { PDFContent } from "@/lib/qr/types";
import { formatBytes, type AssetResolver } from "./resolver";
import { ActionLink, EmptyHint } from "./shared";

export function PdfPublicPage({ data, resolveAsset }: { data: PDFContent; resolveAsset: AssetResolver }) {
  const fileUrl = resolveAsset(data.file);

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <FileText className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <h1 className="text-xl font-semibold tracking-tight">{data.title.trim() || "PDF document"}</h1>
        {data.description.trim() && (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        )}
      </div>

      {data.file ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5">
          <span className="truncate font-mono text-xs">{data.file.fileName}</span>
          {formatBytes(data.file.fileSize) && (
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {formatBytes(data.file.fileSize)}
            </span>
          )}
        </div>
      ) : (
        <EmptyHint>Upload a PDF and it appears here.</EmptyHint>
      )}

      {fileUrl && (
        <div className="space-y-2">
          <ActionLink href={fileUrl}>{data.buttonLabel.trim() || "Open PDF"}</ActionLink>
          <ActionLink href={fileUrl} variant="outline" download>
            <Download className="size-4" aria-hidden />
            Download
          </ActionLink>
        </div>
      )}
    </div>
  );
}
