"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

// Reached via the recovery link → /auth/confirm sets a session → here.
export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">New password</h1>
        <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
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
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
