import {
  AtSign,
  Facebook,
  Ghost,
  Globe,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  Mail,
  MapPin,
  Music,
  Music2,
  Phone,
  Pin,
  ShoppingBag,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { SocialPlatform } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

/**
 * Shared pieces for destination pages/previews. Plain components —
 * they render on the server for /q/[slug] and inside the client
 * wizard preview. Icons are Lucide only (no copied brand assets).
 */

export const SOCIAL_ICONS: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  snapchat: Ghost,
  pinterest: Pin,
  threads: AtSign,
  website: Globe,
};

export const LINK_ICONS: Record<string, LucideIcon> = {
  link: LinkIcon,
  globe: Globe,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  music: Music,
  mail: Mail,
  phone: Phone,
  "map-pin": MapPin,
  "shopping-bag": ShoppingBag,
};

/** Primary action — ink button (design system: blue is rationed). */
export function ActionLink({
  href,
  children,
  variant = "primary",
  download,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  download?: boolean;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      download={download}
      {...(external && !download ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-input bg-background hover:bg-secondary",
      )}
    >
      {children}
    </a>
  );
}

/** Round avatar/logo from a resolved URL, with an initial fallback. */
export function PageAvatar({
  url,
  alt,
  fallback,
  size = "md",
}: {
  url: string | null;
  alt: string;
  fallback: string;
  size?: "md" | "lg";
}) {
  const cls = size === "lg" ? "size-20" : "size-14";
  if (url) {
    return (
      // Works for both signed preview URLs and public bucket URLs.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt} className={cn(cls, "rounded-full border object-cover")} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        cls,
        "flex items-center justify-center rounded-full bg-primary font-mono text-lg text-primary-foreground uppercase",
      )}
    >
      {fallback.trim().charAt(0) || "?"}
    </span>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
