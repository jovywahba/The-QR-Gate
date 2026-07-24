import { NextResponse } from "next/server";
import { runHealth } from "@/lib/health/probe";

/**
 * Machine-readable health for external uptime monitors. Returns 200 when
 * operational/degraded (site is up) and 503 when a critical dependency is
 * unavailable, so a monitor can alert on the status code alone. Exposes
 * only coarse states — no keys, ids, or internals.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const report = await runHealth();
  const httpStatus = report.status === "unavailable" ? 503 : 200;
  return NextResponse.json(
    {
      status: report.status,
      checks: report.checks.map((c) => ({ service: c.key, status: c.status })),
      generated_at: report.generatedAt,
    },
    { status: httpStatus, headers: { "cache-control": "no-store" } },
  );
}
