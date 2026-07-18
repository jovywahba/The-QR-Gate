import { type NextRequest, NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (Google) + magic-link callback. Exchanges the PKCE code for a
 * session, then returns the user to a SAFE same-origin path (default
 * /dashboard). `next` is validated by safeRedirectPath so a crafted
 * link can never bounce the user to an external site (open-redirect
 * guard). The sessionStorage QR draft survives this same-tab round
 * trip, so the user lands back on their exact step.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Behind Vercel's proxy, prefer the forwarded host over the internal origin.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      const base = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=oauth`);
}
