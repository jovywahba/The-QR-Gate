"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copy a value to the clipboard with brief confirmation. */
export function CopyButton({
  value,
  label = "Copy URL",
  iconOnly = false,
}: {
  value: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size={iconOnly ? "icon" : "sm"}
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard may be blocked; no-op */
        }
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {!iconOnly && (copied ? "Copied" : label)}
    </Button>
  );
}
