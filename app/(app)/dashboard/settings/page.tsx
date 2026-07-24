import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/components/app/app-topbar";
import { PRO_PLAN_NAME, FREE_ACTIVE_LIMIT, statusLabel } from "@/lib/billing/plan";
import { getPlanStatus } from "@/lib/billing/plan-server";
import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/dashboard/settings");

  const [{ data: profile }, plan] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
    getPlanStatus(supabase),
  ]);

  const name =
    profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null;
  const avatarUrl =
    profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const planLabel = plan.isUnlimited
    ? `${PRO_PLAN_NAME} · ${statusLabel(plan.status)}`
    : `Free · ${plan.activeCount} of ${FREE_ACTIVE_LIMIT} QR codes used`;

  return (
    <>
      <AppTopbar title="Settings" />
      <div className="p-6">
        <SettingsView
          email={user.email ?? ""}
          name={name}
          avatarUrl={avatarUrl}
          planLabel={planLabel}
          isUnlimited={plan.isUnlimited}
        />
      </div>
    </>
  );
}
