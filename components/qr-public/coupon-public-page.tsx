import { CalendarX2 } from "lucide-react";
import { couponDiscountLabel, isCouponExpired } from "@/lib/qr/coupon";
import { normalizeUrl } from "@/lib/qr/payloads";
import type { CouponContent } from "@/lib/qr/types";
import { CopyCodeButton } from "./copy-code-button";
import type { AssetResolver } from "./resolver";
import { ActionLink, PageAvatar } from "./shared";

export function CouponPublicPage({ data, resolveAsset }: { data: CouponContent; resolveAsset: AssetResolver }) {
  const expired = isCouponExpired(data.expiresAt);
  const discount = couponDiscountLabel(data);
  const redemptionUrl = data.redemptionUrl?.trim() ? normalizeUrl(data.redemptionUrl) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <PageAvatar url={resolveAsset(data.logo)} alt="" fallback={data.businessName || data.title || "C"} />
        {data.businessName.trim() && (
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {data.businessName}
          </p>
        )}
        <h1 className="text-xl font-semibold tracking-tight">{data.title.trim() || "Coupon"}</h1>
        {discount && <p className="font-mono text-2xl font-medium">{discount}</p>}
      </div>

      {expired && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive"
        >
          <CalendarX2 className="size-4" aria-hidden />
          Expired
        </p>
      )}

      {data.description.trim() && (
        <p className="text-center text-sm leading-relaxed text-muted-foreground">{data.description}</p>
      )}

      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Code</p>
          <p className="truncate font-mono text-lg font-medium tracking-wide">{data.code.trim() || "—"}</p>
        </div>
        {data.code.trim() && <CopyCodeButton code={data.code.trim()} />}
      </div>

      {/* Expiry stays visible whether or not it has passed. */}
      {data.expiresAt && (
        <p className="text-center font-mono text-xs text-muted-foreground">
          {expired ? "Expired on" : "Valid until"} {data.expiresAt}
        </p>
      )}

      {!expired && redemptionUrl && (
        <ActionLink href={redemptionUrl}>{data.ctaLabel.trim() || "Redeem offer"}</ActionLink>
      )}

      {data.instructions.trim() && (
        <div className="rounded-lg border bg-card p-3">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            How to redeem
          </p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{data.instructions}</p>
        </div>
      )}

      {data.terms.trim() && (
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">{data.terms}</p>
      )}
    </div>
  );
}
