"use client";

import { CheckCircle2, OctagonX, TriangleAlert } from "lucide-react";
import { qrHealth, type HealthStatus } from "@/lib/qr/health";
import { cn } from "@/lib/utils";
import { useQRWizard } from "../use-qr-wizard";

/**
 * QR Health Score (0-100) + the readability status. A HEURISTIC, not a
 * scan guarantee — an independent decode is the real proof. An Unsafe
 * score still blocks Continue and download (same gate as before).
 */
const TONE: Record<HealthStatus, { color: string; bg: string; border: string; Icon: typeof CheckCircle2 }> = {
  Excellent: { color: "text-[#1B8A5B]", bg: "bg-[#1B8A5B]", border: "bg-card", Icon: CheckCircle2 },
  Good: { color: "text-[#1B8A5B]", bg: "bg-[#1B8A5B]", border: "bg-card", Icon: CheckCircle2 },
  "Needs Attention": { color: "text-[#D9A21B]", bg: "bg-[#D9A21B]", border: "border-[#D9A21B]/50 bg-[#D9A21B]/5", Icon: TriangleAlert },
  Unsafe: { color: "text-destructive", bg: "bg-destructive", border: "border-destructive/50 bg-destructive/5", Icon: OctagonX },
};

export function ReadabilityPanel() {
  const { state, readability } = useQRWizard();
  const health = qrHealth(state.design, { payload: state.generatedPayload });
  const tone = TONE[health.status];
  const Icon = tone.Icon;

  return (
    <section
      id="qr-readability"
      tabIndex={-1}
      aria-label="QR health check"
      className={cn("rounded-lg border p-4 outline-none", tone.border)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", tone.color)} aria-hidden />
          <p className="text-sm font-semibold">QR Health: {health.status}</p>
        </div>
        <span className={cn("font-mono text-lg font-medium tabular-nums", tone.color)} aria-label={`Health score ${health.score} out of 100`}>
          {health.score}
          <span className="text-xs text-muted-foreground">/100</span>
        </span>
      </div>

      {/* Score bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`Health score ${health.score}`}>
        <div className={cn("h-full rounded-full transition-all", tone.bg)} style={{ width: `${health.score}%` }} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{health.disclaimer}</p>

      {/* Issues (errors block download; warnings inform) */}
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

      {/* Actionable guidance when there's room to improve but nothing broken */}
      {readability.issues.length === 0 && health.guidance.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {health.guidance.map((g) => (
            <li key={g} className="flex items-start gap-2 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-[#D9A21B]" aria-hidden />
              {g}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
