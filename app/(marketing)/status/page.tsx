import type { Metadata } from "next";
import { runHealth, STATUS_LABEL, type HealthStatus } from "@/lib/health/probe";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Status",
  description: `${site.name} system status.`,
};

// Live probe on every request (no cache) — real dependency states, no internals.
export const dynamic = "force-dynamic";

const COLOR: Record<HealthStatus, string> = {
  operational: "#1B8A5B",
  degraded: "#D9A21B",
  unavailable: "#C2392F",
  not_configured: "#9A968A",
};

const HEADLINE: Record<HealthStatus, string> = {
  operational: "All systems operational",
  degraded: "Some systems degraded",
  unavailable: "Service disruption",
  not_configured: "Partially configured",
};

export default async function StatusPage() {
  const report = await runHealth();

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="font-mono text-xs uppercase tracking-wider text-accent">Status</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{HEADLINE[report.status]}</h1>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Checked {new Date(report.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border bg-card">
        {report.checks.map((c, i) => (
          <div key={c.key} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t" : ""}`}>
            <span className="text-sm font-medium">{c.label}</span>
            <span className="inline-flex items-center gap-2 text-sm" style={{ color: COLOR[c.status] }}>
              <span className="size-1.5 rounded-full" style={{ background: COLOR[c.status] }} />
              {STATUS_LABEL[c.status]}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Machine-readable status:{" "}
        <a href="/api/health" className="font-mono text-accent hover:underline">
          /api/health
        </a>
      </p>
    </div>
  );
}
