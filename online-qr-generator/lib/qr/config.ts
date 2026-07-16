/**
 * Publishing configuration detection. Direct QR types never touch
 * Supabase; hosted publishing/uploads need these three env vars. When
 * they're missing we surface a clear configuration error instead of
 * silently mocking anything.
 */

function isSet(value: string | undefined): boolean {
  return !!value && !value.includes("placeholder");
}

/** Client-safe: only inspects NEXT_PUBLIC_* values. */
export function publicSupabaseConfig(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!isSet(process.env.NEXT_PUBLIC_SUPABASE_URL)) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!isSet(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { configured: missing.length === 0, missing };
}

/** SERVER-ONLY: additionally checks the service-role key (value never leaves the server). */
export function serverSupabaseConfig(): { configured: boolean; missing: string[] } {
  const base = publicSupabaseConfig();
  const missing = [...base.missing];
  if (!isSet(process.env.SUPABASE_SERVICE_ROLE_KEY)) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { configured: missing.length === 0, missing };
}
