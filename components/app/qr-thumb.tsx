import { QrCode } from "lucide-react";
import { getQRType, isQRType } from "@/lib/qr/registry";
import { cn } from "@/lib/utils";

/**
 * A small, consistent type tile for QR rows/cards. We show the QR
 * type's icon rather than rendering a live QR canvas per row — the true
 * styled code (with the user's colors, frame, and logo) is one click
 * away in the builder/analytics, and this keeps long lists instant.
 */
export function QrThumb({
  type,
  className,
  size = "md",
}: {
  type: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = isQRType(type) ? getQRType(type).icon : QrCode;
  return (
    <span
      aria-hidden
      className={cn(
        "flex flex-none items-center justify-center rounded-md border bg-secondary text-muted-foreground",
        size === "sm" ? "size-9" : "size-10",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-4" : "size-[18px]"} />
    </span>
  );
}
