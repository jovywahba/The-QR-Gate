"use server";

import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { site } from "@/lib/site";
import { getStripe, isBillingConfigured, proPriceId } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Start a Stripe Checkout for The QR Gate Pro ($10/mo). The price is
 * taken ONLY from server env (STRIPE_PRICE_PRO_MONTHLY) — a browser
 * can never pass a price id. `returnTo` lets the paywall bring the
 * user back to their in-progress QR after paying (safe path only).
 */
export async function startCheckout(formData?: FormData) {
  if (!isBillingConfigured()) redirect("/dashboard/billing?status=unconfigured");
  const stripe = getStripe();
  const price = proPriceId()!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/dashboard/billing");

  const returnTo = safeRedirectPath(formData?.get("returnTo"), "/dashboard/billing?status=success");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  const customerId = profile?.stripe_customer_id ?? undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${site.url}${returnTo}`,
    cancel_url: `${site.url}/dashboard/billing?status=cancelled`,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    customer: customerId,
    customer_email: customerId ? undefined : (user.email ?? undefined),
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function openPortal() {
  if (!isBillingConfigured()) redirect("/dashboard/billing?status=unconfigured");
  const stripe = getStripe();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/dashboard/billing");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) redirect("/dashboard/billing");

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${site.url}/dashboard/billing`,
  });

  redirect(session.url);
}
