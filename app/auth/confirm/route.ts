import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emails";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

// Handles Supabase email links (signup confirmation + password recovery).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectPath(searchParams.get("next"), "/dashboard");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // First-time confirmation → best-effort welcome (inert without Resend).
      if (type === "signup" || type === "email") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) await sendWelcomeEmail(user.email);
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/sign-in?error=invalid_link", request.url));
}
