import type { CouponContent } from "./types";

/** "2026-07-16" → expired once that whole day has passed (local time). */
export function isCouponExpired(expiresAt: string, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiresAt.trim());
  if (!m) return false;
  const endOfDay = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
  if (Number.isNaN(endOfDay.getTime())) return false;
  return now.getTime() > endOfDay.getTime();
}

/** Human label for the discount, e.g. "20% off", "$15 off", or custom text. */
export function couponDiscountLabel(data: Pick<CouponContent, "discountType" | "discountValue">): string {
  const value = data.discountValue.trim();
  if (!value) return "";
  switch (data.discountType) {
    case "percent":
      return `${value.replace(/%$/, "")}% off`;
    case "amount":
      return `${value} off`;
    case "text":
      return value;
  }
}
