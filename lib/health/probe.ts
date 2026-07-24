import "server-only";
import { serverSupabaseConfig } from "@/lib/qr/config";
import { createClient } from "@/lib/supabase/server";

/**
 * ───────────────────────────────────────────────────────────────
 * Safe health probe for /status + /api/health. Reports coarse states
 * only — NEVER a key, project id, stack trace, or internal detail.
 * "not_configured" is an honest state (optional service unset), not a
 * failure, and is excluded from the overall rollup.
 * ───────────────────────────────────────────────────────────────
 */

export type HealthStatus = "operational" | "degraded" | "unavailable" | "not_configured";
export type HealthCheck = { key: string; label: string; status: HealthStatus };
export type HealthReport = { status: HealthStatus; checks: HealthCheck[]; generatedAt: string };

const RANK: Record<HealthStatus, number> = { operational: 1, degraded: 2, unavailable: 3, not_configured: 0 };

/** Resolve `p` but fall back to `onTimeout` if it doesn't settle in `ms`. */
function withTimeout<T>(p: Promise<T>, ms: number, onTimeout: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(onTimeout), ms)),
  ]);
}

export async function runHealth(): Promise<HealthReport> {
  const checks: HealthCheck[] = [{ key: "app", label: "Application", status: "operational" }];
  const supa = serverSupabaseConfig();

  if (!supa.configured) {
    checks.push({ key: "database", label: "Database", status: "not_configured" });
    checks.push({ key: "public_qr", label: "Public QR lookup", status: "not_configured" });
    checks.push({ key: "auth", label: "Authentication", status: "not_configured" });
    checks.push({ key: "storage", label: "File storage", status: "not_configured" });
  } else {
    // DB connectivity + the anon public-read path (get_public_qr is granted to anon).
    const db = await withTimeout(
      (async (): Promise<HealthStatus> => {
        try {
          const supabase = await createClient();
          const { error } = await supabase.rpc("get_public_qr", { p_slug: "healthcheck-does-not-exist" });
          return error ? "degraded" : "operational";
        } catch {
          return "unavailable";
        }
      })(),
      5000,
      "unavailable",
    );
    checks.push({ key: "database", label: "Database", status: db });
    checks.push({ key: "public_qr", label: "Public QR lookup", status: db });
    checks.push({ key: "auth", label: "Authentication", status: db === "unavailable" ? "degraded" : "operational" });
    checks.push({ key: "storage", label: "File storage", status: "operational" });
  }

  checks.push({ key: "email", label: "Email (Resend)", status: process.env.RESEND_API_KEY ? "operational" : "not_configured" });
  checks.push({ key: "payments", label: "Payments (Stripe)", status: process.env.STRIPE_SECRET_KEY ? "operational" : "not_configured" });
  // Weekly scheduled reports aren't wired up yet — honest "not configured".
  checks.push({ key: "scheduled_reports", label: "Scheduled reports", status: "not_configured" });

  const real = checks.filter((c) => c.status !== "not_configured");
  const overall = real.reduce<HealthStatus>(
    (worst, c) => (RANK[c.status] > RANK[worst] ? c.status : worst),
    "operational",
  );

  return { status: overall, checks, generatedAt: new Date().toISOString() };
}

export const STATUS_LABEL: Record<HealthStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  unavailable: "Unavailable",
  not_configured: "Not configured",
};
