"use client";

import { Download, ExternalLink, FileText } from "lucide-react";
import type { AssetRef } from "@/lib/qr/types";
import { Body, GhostBtn, PrimaryBtn } from "./kit";

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Renders the REAL PDF (local demo fixture or the uploaded/published
 * Supabase file) in the browser's native viewer via <object>, with the
 * real filename + size and working Open / Download. No fake cover.
 */
export function PdfViewer({
  file,
  buttonLabel = "Open PDF",
  title,
  description,
}: {
  file: AssetRef | null;
  buttonLabel?: string;
  title?: string;
  description?: string;
}) {
  if (!file?.previewUrl) {
    return (
      <Body top className="flex min-h-full flex-col items-center justify-center text-center">
        <FileText className="size-8 text-muted-foreground/50" aria-hidden />
        <p className="text-xs text-muted-foreground">Upload a PDF to preview it here.</p>
      </Body>
    );
  }
  const url = file.previewUrl;
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b bg-muted/40 px-4 pt-10 pb-2">
        <p className="truncate text-sm font-semibold">{title?.trim() || file.fileName}</p>
        {description?.trim() && <p className="truncate text-[11px] text-muted-foreground">{description}</p>}
      </div>
      {/* Real embedded PDF. */}
      <object data={`${url}#toolbar=0&view=FitH`} type="application/pdf" className="h-64 w-full bg-muted">
        <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
          Your browser can&apos;t inline PDFs — use Open below.
        </div>
      </object>
      <Body>
        <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
          <span className="truncate font-mono text-[11px]">{file.fileName}</span>
          {formatBytes(file.fileSize) && (
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{formatBytes(file.fileSize)}</span>
          )}
        </div>
        <a href={url} target="_blank" rel="noreferrer">
          <PrimaryBtn icon={ExternalLink}>{buttonLabel}</PrimaryBtn>
        </a>
        <a href={url} download={file.fileName}>
          <GhostBtn icon={Download}>Download</GhostBtn>
        </a>
      </Body>
    </div>
  );
}
