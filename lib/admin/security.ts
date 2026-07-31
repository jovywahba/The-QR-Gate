import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records REAL security signals to public.security_events via the service-role
 * client (writes bypass RLS; the table is admin-read-only). Best-effort and
 * never throws — security telemetry must not break the request path. If 0006
 * isn't applied yet the insert fails and is silently ignored (the Security
 * Center then honestly shows "Not tracked", never a fabricated alert).
 *
 * Only signals the stack can genuinely observe are recorded here. Things it
 * cannot see yet (e.g. GoTrue failed-login attempts) are simply never written.
 */

export type SecurityEventType =
  | "admin_permission_denied"
  | "webhook_signature_invalid"
  | "suspended_access_attempt";

export async function recordSecurityEvent(args: {
  eventType: SecurityEventType | string;
  severity?: "info" | "warning" | "critical";
  actorUserId?: string | null;
  subject?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("security_events").insert({
      event_type: args.eventType,
      severity: args.severity ?? "info",
      actor_user_id: args.actorUserId ?? null,
      // Keep the subject coarse — never a raw IP, token, or secret.
      subject: args.subject ? args.subject.slice(0, 200) : null,
      metadata: args.metadata ?? {},
    });
  } catch {
    /* telemetry is best-effort */
  }
}
