"use client";

import * as React from "react";
import { Apple, Globe, Play, Smartphone } from "lucide-react";
import { normalizeUrl } from "@/lib/qr/payloads";
import type { AppsContent } from "@/lib/qr/types";
import { ActionLink } from "./shared";

/**
 * Device-aware store buttons — honest behavior only: we detect
 * iOS/Android to pick which button leads, but ALWAYS render every
 * provided store (no forced redirects, no redirect loops).
 */
export function AppsStoreButtons({ data }: { data: AppsContent }) {
  const [platform, setPlatform] = React.useState<"ios" | "android" | "other">("other");

  React.useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform("ios");
    else if (/Android/i.test(ua)) setPlatform("android");
  }, []);

  const stores = [
    { key: "ios", url: normalizeUrl(data.appStoreUrl), label: "Download on the App Store", icon: Apple },
    { key: "android", url: normalizeUrl(data.playStoreUrl), label: "Get it on Google Play", icon: Play },
    { key: "huawei", url: normalizeUrl(data.appGalleryUrl), label: "Explore on AppGallery", icon: Smartphone },
  ].filter((s) => s.url);

  const website = data.websiteUrl?.trim() ? normalizeUrl(data.websiteUrl) : null;

  // Put the visitor's platform first; everything stays visible.
  const ordered = [...stores].sort((a, b) => (a.key === platform ? -1 : b.key === platform ? 1 : 0));

  if (ordered.length === 0 && !website) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Add at least one store link.</p>;
  }

  return (
    <div className="space-y-2">
      {ordered.map((store, i) => (
        <ActionLink key={store.key} href={store.url!} variant={i === 0 ? "primary" : "outline"}>
          <store.icon className="size-4" aria-hidden />
          {store.label}
        </ActionLink>
      ))}
      {website && (
        <ActionLink href={website} variant={ordered.length === 0 ? "primary" : "outline"}>
          <Globe className="size-4" aria-hidden />
          Visit the website
        </ActionLink>
      )}
    </div>
  );
}
