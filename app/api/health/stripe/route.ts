import { NextResponse } from "next/server";
import { verifyLiveBilling } from "@/lib/stripe/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Safe Stripe self-check. Runs on the server (so it can use the Live key that
 * only exists in Vercel Production) and returns ONLY correctness booleans and
 * coarse labels — never a key, a price/product/customer id, or any payload.
 * Result is cached 60s inside verifyLiveBilling to avoid hammering Stripe.
 * 200 when billing is fully valid; 503 otherwise (honest, machine-readable).
 */
export async function GET() {
  const v = await verifyLiveBilling();
  return NextResponse.json(v, { status: v.ok ? 200 : 503 });
}
