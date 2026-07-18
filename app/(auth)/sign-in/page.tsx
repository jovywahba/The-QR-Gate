"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/app/auth/actions";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  // Set by the QR wizard (and middleware) so signing in returns to the
  // exact step; the server action re-validates it is a same-origin path.
  const redirectTo = useSearchParams().get("redirect") ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back.</p>
      </div>
      <GoogleButton next={redirectTo || undefined} />
      <AuthDivider />
      <form action={action} className="flex flex-col gap-4">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
        <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-accent hover:underline">
            Forgot?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link
          href={redirectTo ? `/sign-up?redirect=${encodeURIComponent(redirectTo)}` : "/sign-up"}
          className="text-accent hover:underline"
        >
          Start free
        </Link>
      </p>
    </div>
  );
}
