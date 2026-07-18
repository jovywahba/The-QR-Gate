import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  sendPaymentFailedEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionCanceledEmail,
} from "@/lib/emails";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Admin = ReturnType<typeof createAdminClient>;

async function userIdForCustomer(supabase: Admin, customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function emailForUser(supabase: Admin, userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

function iso(seconds: number | null | undefined): string | null {
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

/** Mirror a Stripe subscription into public.subscriptions (service role). Throws on write failure. */
async function upsertSubscription(supabase: Admin, userId: string, sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price.id ?? null;
  const { error } = await supabase.from("subscriptions").upsert({
    id: sub.id,
    user_id: userId,
    status: sub.status,
    price_id: priceId,
    stripe_price_id: priceId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    current_period_start: iso(sub.current_period_start),
    current_period_end: iso(sub.current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end,
  });
  // Surface write failures so the handler 500s and Stripe retries (the event
  // is only recorded as processed AFTER the handler fully succeeds).
  if (error) throw new Error(`subscription upsert failed: ${error.code}`);
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

  // ── Idempotency (fast path): skip events we've already fully processed.
  // We record an event as processed ONLY after its handler succeeds (below),
  // so a first-attempt failure isn't masked — Stripe's retry reprocesses it.
  try {
    const { data: seen } = await supabase
      .from("stripe_webhook_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();
    if (seen) return NextResponse.json({ received: true, duplicate: true });
  } catch {
    // Ledger table missing (schema not applied) → proceed best-effort.
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.user_id ?? null;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        if (userId && customerId) {
          const { error: linkError } = await supabase
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
          if (linkError) throw new Error(`customer link failed: ${linkError.code}`);
          // Upsert the subscription immediately (avoids create/link ordering races).
          if (session.subscription) {
            const subId =
              typeof session.subscription === "string" ? session.subscription : session.subscription.id;
            const sub = await stripe.subscriptions.retrieve(subId);
            await upsertSubscription(supabase, userId, sub);
          }
          const email = await emailForUser(supabase, userId);
          if (email) await sendSubscriptionActivatedEmail(email);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const userId = await userIdForCustomer(supabase, customerId);
        if (userId) await upsertSubscription(supabase, userId, sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const userId = await userIdForCustomer(supabase, customerId);
        if (userId) {
          await upsertSubscription(supabase, userId, sub); // status → canceled
          const email = await emailForUser(supabase, userId);
          if (email) await sendSubscriptionCanceledEmail(email);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
        if (customerId) {
          const userId = await userIdForCustomer(supabase, customerId);
          if (userId) {
            const email = await emailForUser(supabase, userId);
            if (email) await sendPaymentFailedEmail(email);
          }
        }
        break;
      }
      case "invoice.paid":
        // The subscription.updated event carries the new period — nothing to do here.
        break;
      default:
        break;
    }
  } catch (err) {
    // Do NOT record the event as processed — returning 500 lets Stripe retry.
    console.error("Stripe webhook handler error:", err);
    return new NextResponse("Handler error", { status: 500 });
  }

  // Handler fully succeeded → record the event so retries are deduped.
  try {
    await supabase.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type });
  } catch {
    // Conflict (concurrent delivery) or missing table → safe to ignore.
  }
  return NextResponse.json({ received: true });
}
