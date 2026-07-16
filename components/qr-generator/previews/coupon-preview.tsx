"use client";

import { CouponPublicPage } from "@/components/qr-public/coupon-public-page";
import { previewResolver } from "@/components/qr-public/resolver";
import type { CouponContent } from "@/lib/qr/types";

export function CouponPreview({ data }: { data: CouponContent }) {
  return <CouponPublicPage data={data} resolveAsset={previewResolver} />;
}
