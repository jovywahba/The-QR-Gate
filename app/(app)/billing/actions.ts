"use server";

import { redirect } from "next/navigation";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { stripeConfig } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export async function startCheckout() {
  // Billing is optional — never crash the app when Stripe isn't set up.
  if (!isStripeConfigured()) redirect("/billing?status=unconfigured");
  const stripe = getStripe();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const customerId = profile?.stripe_customer_id ?? undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: stripeConfig.priceId, quantity: 1 }],
    subscription_data: { trial_period_days: stripeConfig.trialDays },
    success_url: `${site.url}/billing?status=success`,
    cancel_url: `${site.url}/billing?status=cancelled`,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    customer: customerId,
    customer_email: customerId ? undefined : (user.email ?? undefined),
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function openPortal() {
  if (!isStripeConfigured()) redirect("/billing?status=unconfigured");
  const stripe = getStripe();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) redirect("/billing");

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${site.url}/billing`,
  });

  redirect(session.url);
}
