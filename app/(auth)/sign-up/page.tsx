"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp, type AuthState } from "@/app/auth/actions";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  // Carries the QR wizard's return path through email confirmation + OAuth.
  const redirectTo = useSearchParams().get("redirect") ?? "";

  if (state.message) {
    return (
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-lg font-semibold">Almost there</h1>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Create an account</h1>
        <p className="text-sm text-muted-foreground">Start free — 3 QR codes, no card required.</p>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Have an account?{" "}
        <Link
          href={redirectTo ? `/sign-in?redirect=${encodeURIComponent(redirectTo)}` : "/sign-in"}
          className="text-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
