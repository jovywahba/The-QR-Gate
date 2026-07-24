"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CreditCard, KeyRound, LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDisplayName, type SettingsState } from "./actions";

const initial: SettingsState = {};

type Props = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  planLabel: string;
  isUnlimited: boolean;
};

function initials(name: string | null, email: string): string {
  const base = name || email;
  const parts = base.trim().split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function SettingsView({ email, name, avatarUrl, planLabel, isUnlimited }: Props) {
  const [state, action, pending] = useActionState(updateDisplayName, initial);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Profile */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar className="size-14">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name || "No name set"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={name ?? ""}
              maxLength={80}
              placeholder="Your name"
              autoComplete="name"
            />
            <p className="text-xs text-muted-foreground">
              Shown in your dashboard greeting and account menu.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              Your sign-in email. Contact support to change it.
            </p>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.message ? <p className="text-sm text-[#1B8A5B]">{state.message}</p> : null}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Plan */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h2 className="text-sm font-semibold">Plan &amp; billing</h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{planLabel}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/billing">
            <CreditCard aria-hidden />
            {isUnlimited ? "Manage billing" : "Upgrade to Pro"}
          </Link>
        </Button>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold">Security</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/forgot-password">
              <KeyRound aria-hidden />
              Reset password
            </Link>
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              <LogOut aria-hidden />
              Sign out
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
