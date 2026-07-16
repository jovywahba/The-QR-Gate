"use client";

import * as React from "react";
import { CheckCircle2, OctagonX, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQRWizard } from "../use-qr-wizard";

/**
 * Readability status — a labelled heuristic (contrast, quiet zone,
 * logo/EC rules), not a scan guarantee. Errors block Continue and
 * download; the decode QA is the real proof.
 */
export function ReadabilityPanel() {
  const { readability } = useQRWizard();
  const errors = readability.issues.filter((i) => i.level === "error");
  const warnings = readability.issues.filter((i) => i.level === "warning");

  const status = errors.length > 0 ? "unsafe" : warnings.length > 0 ? "attention" : "good";

  return (
    <section
      id="qr-readability"
      tabIndex={-1}
      aria-label="Readability check"
      className={cn(
        "rounded-lg border p-4 outline-none",
        status === "unsafe" && "border-destructive/50 bg-destructive/5",
        status === "attention" && "border-[#D9A21B]/50 bg-[#D9A21B]/5",
        status === "good" && "bg-card",
      )}
    >
      <div className="flex items-center gap-2">
        {status === "good" && <CheckCircle2 className="size-4 text-[#1B8A5B]" aria-hidden />}
        {status === "attention" && <TriangleAlert className="size-4 text-[#D9A21B]" aria-hidden />}
        {status === "unsafe" && <OctagonX className="size-4 text-destructive" aria-hidden />}
        <p className="text-sm font-semibold">
          {status === "good" && "Readability: Good"}
          {status === "attention" && "Readability: Needs attention"}
          {status === "unsafe" && "Readability: Unsafe"}
        </p>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {status === "good"
          ? "Good contrast and safe settings. Still test with a phone before printing."
          : "A heuristic check — fix the items below, then test with a phone."}
      </p>

      {readability.issues.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {readability.issues.map((issue) => (
            <li key={issue.code} className="flex items-start gap-2 text-sm">
              {issue.level === "error" ? (
                <OctagonX className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
              ) : (
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-[#D9A21B]" aria-hidden />
              )}
              <span className={issue.level === "error" ? "text-destructive" : "text-foreground"}>
                {issue.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
