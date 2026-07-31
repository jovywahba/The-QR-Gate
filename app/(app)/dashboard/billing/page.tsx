import type { Metadata } from "next";
import { AppTopbar } from "@/components/app/app-topbar";
import { getPlanStatus } from "@/lib/billing/plan-server";
import { isBillingConfigured } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { BillingView } from "./billing-view";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const [plan, { data: { user } }] = await Promise.all([getPlanStatus(supabase), supabase.auth.getUser()]);
  const { data: profile } = user
    ? await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle()
    : { data: null };
  const hasCustomer = Boolean(profile?.stripe_customer_id);

  return (
    <>
      <AppTopbar title="Billing" />
      <BillingView
        plan={plan}
        billingReady={isBillingConfigured()}
        hasCustomer={hasCustomer}
        statusParam={status ?? null}
      />
    </>
  );
}
