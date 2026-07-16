"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

/** Really copies the code, with an accessible confirmation. */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions / http) — select-able code stays visible.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      {copied ? <Check className="size-4 text-[#1B8A5B]" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copied" : "Copy code"}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Coupon code copied to clipboard" : ""}
      </span>
    </button>
  );
}
