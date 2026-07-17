import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Admin = ReturnType<typeof createAdminClient>;

async function userIdForCustomer(supabase: Admin, customerId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

// Stripe POSTs here. Signature is verified before anything else (hard gate §10).
export async function POST(req: NextRequest) {
  // Billing is optional — without credentials this endpoint is simply off.
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const stripe = getStripe();

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.user_id ?? null;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (userId && customerId) {
          await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const userId = await userIdForCustomer(supabase, customerId);
        if (userId) {
          await supabase.from("subscriptions").upsert({
            id: sub.id,
            user_id: userId,
            status: sub.status,
            price_id: sub.items.data[0]?.price.id ?? null,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
