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
  const plan = await getPlanStatus(supabase);

  return (
    <>
      <AppTopbar title="Billing" />
      <BillingView plan={plan} billingReady={isBillingConfigured()} statusParam={status ?? null} />
    </>
  );
}
