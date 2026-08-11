import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/guard";
import { isStripeConfigured } from "@/lib/stripe/config";
import { listPromoCodes, type PromoRow } from "@/lib/stripe/promos-server";
import { PromoManager } from "./promo-manager";

export const metadata: Metadata = { title: "Promo Codes" };
export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  await requireAdmin("manage_promotions");

  if (!isStripeConfigured()) {
    return (
      <>
        <AdminTopbar title="Promo Codes" />
        <div className="p-6">
          <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
            Stripe isn&apos;t configured on this deployment, so promo codes can&apos;t be created here.
            Add the Stripe keys (see <span className="font-mono text-xs">.env.example</span>) first.
          </div>
        </div>
      </>
    );
  }

  let promos: PromoRow[] = [];
  let failed = false;
  try {
    promos = await listPromoCodes();
  } catch {
    failed = true;
  }

  return (
    <>
      <AdminTopbar title="Promo Codes" />
      <div className="space-y-4 p-6">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Create discount codes for The QR Gate Pro. Customers enter the code on the Stripe checkout
          page. Stripe is the source of truth — codes here are real Stripe coupons + promotion codes,
          and every create/deactivate is audited.
        </p>
        {failed ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
            Couldn&apos;t reach Stripe to load promo codes. Check the Stripe key and try again.
          </div>
        ) : (
          <PromoManager promos={promos} />
        )}
      </div>
    </>
  );
}
