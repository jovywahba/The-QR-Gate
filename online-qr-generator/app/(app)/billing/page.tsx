import { AppTopbar } from "@/components/app/app-topbar";
import { createClient } from "@/lib/supabase/server";
import { BillingView } from "./billing-view";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // DEV: the dashboard auth-bypass can leave `user` null in development, so guard
  // the query (prod is always behind auth). Remove the bypass before launch.
  const { data: sub } = user
    ? await supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const active = sub ? ["active", "trialing"].includes(sub.status) : false;

  return (
    <>
      <AppTopbar title="Billing" />
      <BillingView active={active} status={sub?.status ?? null} />
    </>
  );
}
