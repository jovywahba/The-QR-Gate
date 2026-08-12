import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Minimal, serializable auth snapshot passed from server layouts into the
 *  client header so it renders the correct state on first paint (no
 *  signed-out → signed-in flash). */
export type HeaderUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
} | null;

/**
 * Resolve the current user server-side for header display. Authoritative
 * (validates the session) and cheap — the middleware has already refreshed
 * the session cookie for this request. Never throws; returns null when
 * signed out or when Supabase isn't configured.
 */
export async function getHeaderUser(): Promise<HeaderUser> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.full_name as string | undefined) ?? null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    };
  } catch {
    return null;
  }
}
