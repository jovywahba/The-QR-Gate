import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/billing"];

/**
 * Refreshes the Supabase session cookie and guards (app) routes.
 * Do not run logic between createServerClient and getUser().
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const returnTo = path + request.nextUrl.search;
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?redirect=${encodeURIComponent(returnTo)}`;
    return NextResponse.redirect(url);
  }

  // Signed-in users have no reason to see the auth screens — send them on.
  if (user && (path === "/sign-in" || path === "/sign-up")) {
    const raw = request.nextUrl.searchParams.get("redirect") ?? "";
    const dest = raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/dashboard";
    const url = request.nextUrl.clone();
    const [pathname, search] = dest.split(/\?(.*)/s);
    url.pathname = pathname;
    url.search = search ? `?${search}` : "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
