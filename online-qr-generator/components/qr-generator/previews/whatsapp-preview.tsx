"use client";

import { MessageCircle } from "lucide-react";
import { cleanWhatsAppPhone } from "@/lib/qr/payloads";
import type { WhatsAppContent } from "@/lib/qr/types";

/** Accurate destination summary — scanning opens a WhatsApp chat. */
export function WhatsAppPreview({ data }: { data: WhatsAppContent }) {
  const phone = cleanWhatsAppPhone(data.countryCode, data.phone);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted" aria-hidden>
          <MessageCircle className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">WhatsApp chat</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {phone ? `+${phone}` : "Add a phone number"}
          </p>
        </div>
      </div>
      {data.message?.trim() ? (
        <div className="ml-6 rounded-lg rounded-tl-none border bg-secondary p-3">
          <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">{data.message}</p>
          <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">pre-filled</p>
        </div>
      ) : (
        <p className="px-1 text-xs text-muted-foreground">
          Scanning opens a chat with this number. Add a message to pre-fill it.
        </p>
      )}
    </div>
  );
}
