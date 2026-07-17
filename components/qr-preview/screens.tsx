"use client";

import * as React from "react";
import {
  Apple,
  BadgeCheck,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Images as ImagesIcon,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Pause,
  Phone,
  Play,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Ticket,
  UserPlus,
  UtensilsCrossed,
  Volume2,
  Wifi,
} from "lucide-react";
import { SOCIAL_ICONS } from "@/components/qr-public/shared";
import { couponDiscountLabel, isCouponExpired } from "@/lib/qr/coupon";
import { cleanWhatsAppPhone, normalizeFacebookUrl, normalizeInstagramInput } from "@/lib/qr/payloads";
import type {
  AppsContent,
  BusinessContent,
  CouponContent,
  FacebookContent,
  ImagesContent,
  InstagramContent,
  LinksContent,
  MenuContent,
  MP3Content,
  PDFContent,
  QRContent,
  SocialContent,
  VCardContent,
  VideoContent,
  WebsiteContent,
  WhatsAppContent,
  WiFiContent,
} from "@/lib/qr/types";
import { cn } from "@/lib/utils";
import {
  Avatar,
  Body,
  Chip,
  Field,
  GhostBtn,
  Hero,
  IconAction,
  Metric,
  PrimaryBtn,
  SectionLabel,
  Stars,
} from "./kit";

/**
 * Sixteen bespoke mobile destination screens — each looks like the
 * real thing someone sees after scanning that QR type, not a generic
 * card. Rendered inside <PhoneFrame> for both the Step-1 hover sample
 * (sample=true, illustrative extras shown) and the live Step-2+ preview
 * (sample=false, only the user's real fields). Preview-only.
 */

/** Inline gradient image (self-contained, no network) for decorative tiles. */
function gradient(from: string, to: string, w = 300, h = 300): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
    `</linearGradient></defs><rect width='${w}' height='${h}' fill='url(%23g)'/></svg>`;
  return `data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/ /g, "%20")}`;
}

const TILES = [
  gradient("#3B5BFF", "#6E86FF"),
  gradient("#1B8A5B", "#9AD6B4"),
  gradient("#D9A21B", "#F0D89B"),
  gradient("#1B1B2F", "#6B675C"),
  gradient("#C2392F", "#F0A59B"),
  gradient("#6E86FF", "#1B1B2F"),
];

function domainOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/* ── 1 · Website — modern landing page ── */
function WebsiteScreen({ data }: { data: WebsiteContent; sample: boolean }) {
  return (
    <div>
      <Hero height="h-44">
        <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur">
          <Globe className="size-3" aria-hidden />
          {domainOf(data.url || "theqrgate.com")}
        </span>
        <p className="text-lg leading-tight font-semibold text-white">{data.title || "The QR Gate"}</p>
      </Hero>
      <Body>
        <p className="text-base leading-snug font-semibold">
          {data.description || "Everything you need, one scan away."}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Create, customize, and share professional QR experiences your audience actually enjoys.
        </p>
        <PrimaryBtn icon={ExternalLink}>Explore now</PrimaryBtn>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {["16 QR types", "Live design", "Instant share", "No app needed"].map((f) => (
            <div key={f} className="rounded-xl border bg-card p-2.5">
              <span className="size-1.5 rounded-full bg-accent" />
              <p className="mt-1.5 text-[11px] font-medium">{f}</p>
            </div>
          ))}
        </div>
      </Body>
    </div>
  );
}

/* ── 2 · PDF — document viewer ── */
function PdfScreen({ data, sample }: { data: PDFContent; sample: boolean }) {
  const sizeMb = data.file ? (data.file.fileSize / (1024 * 1024)).toFixed(1) : null;
  return (
    <Body top>
      <div className="mx-auto w-32 rotate-[-2deg] rounded-lg border bg-white p-3 shadow-md">
        <div className="mb-2 h-2 w-8 rounded-full bg-primary/80" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={cn("mb-1.5 h-1 rounded-full bg-muted", i % 3 === 2 ? "w-1/2" : "w-full")} />
        ))}
      </div>
      <div className="space-y-1 pt-2 text-center">
        <h1 className="text-base font-semibold">{data.title || "Document"}</h1>
        {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        <Chip>PDF</Chip>
        {sizeMb && <Chip>{sizeMb} MB</Chip>}
        {sample && <Chip>24 pages</Chip>}
      </div>
      <PrimaryBtn icon={FileText}>{data.buttonLabel || "Open PDF"}</PrimaryBtn>
      <GhostBtn icon={Download}>Download</GhostBtn>
      {sample && <p className="text-center text-[10px] text-muted-foreground">Updated 3 days ago</p>}
    </Body>
  );
}

/* ── 3 · List of Links — link-in-bio ── */
function LinksScreen({ data, sample }: { data: LinksContent; sample: boolean }) {
  const links = data.links.filter((l) => l.label.trim());
  return (
    <div className="min-h-full bg-gradient-to-b from-secondary to-background">
      <Body top className="text-center">
        <div className="flex flex-col items-center gap-2">
          <Avatar src={data.image?.previewUrl} name={data.title} size={68} />
          <div className="flex items-center gap-1">
            <p className="text-base font-semibold">{data.title || "Your name"}</p>
            {sample && <BadgeCheck className="size-4 fill-accent text-background" aria-hidden />}
          </div>
          {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
        </div>
        <div className="space-y-2 pt-1">
          {(links.length ? links : [{ id: "p", label: "Add your first link", url: "", icon: "link" }]).map((l) => (
            <div
              key={l.id}
              className="flex h-11 items-center justify-between rounded-xl border bg-card px-4 text-sm font-medium shadow-sm"
            >
              <span className="truncate">{l.label}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          ))}
        </div>
        {sample && (
          <div className="flex justify-center gap-4 pt-1 text-muted-foreground">
            {(["instagram", "youtube", "x"] as const).map((p) => {
              const Icon = SOCIAL_ICONS[p];
              return <Icon key={p} className="size-4" aria-hidden />;
            })}
          </div>
        )}
      </Body>
    </div>
  );
}

/* ── 4 · vCard — contact profile ── */
function VcardScreen({ data }: { data: VCardContent; sample: boolean }) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Your name";
  const role = [data.jobTitle, data.company].filter((s) => s?.trim()).join(" · ");
  const address = [data.street, data.city, data.country].filter((s) => s?.trim()).join(", ");
  return (
    <div>
      <div className="relative h-20 bg-gradient-to-br from-accent/80 to-primary" />
      <Body className="-mt-9">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Avatar name={name} size={64} />
          <p className="text-base font-semibold">{name}</p>
          {role && <p className="text-xs text-muted-foreground">{role}</p>}
        </div>
        <div className="flex gap-2 pt-1">
          <IconAction icon={Phone} label="Call" />
          <IconAction icon={Mail} label="Email" />
          <IconAction icon={UserPlus} label="Save" />
        </div>
        <div className="divide-y rounded-xl border bg-card px-2">
          {data.mobile?.trim() && <Field icon={Phone} label="Mobile" value={data.mobile} />}
          {data.email?.trim() && <Field icon={Mail} label="Email" value={data.email} />}
          {data.website?.trim() && <Field icon={Globe} label="Website" value={data.website} />}
          {address && <Field icon={MapPin} label="Address" value={address} />}
        </div>
      </Body>
    </div>
  );
}

/* ── 5 · Business — local business profile ── */
function BusinessScreen({ data, sample }: { data: BusinessContent; sample: boolean }) {
  const hours = data.hours.filter((h) => !h.closed).slice(0, 3);
  return (
    <div>
      <Hero src={data.cover?.previewUrl} height="h-28" />
      <Body className="-mt-8">
        <div className="flex items-end gap-3">
          <Avatar src={data.logo?.previewUrl} name={data.name} size={56} />
          <div className="min-w-0 flex-1 pb-1">
            <p className="truncate text-base font-semibold">{data.name || "Your business"}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {data.category && <span className="text-[11px] text-muted-foreground">{data.category}</span>}
              {sample && <Chip tone="open">Open now</Chip>}
            </div>
          </div>
        </div>
        {sample && <Stars value={4.8} />}
        {data.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">{data.description}</p>
        )}
        <div className="flex gap-2">
          {data.phone?.trim() && <IconAction icon={Phone} label="Call" />}
          <IconAction icon={Navigation} label="Directions" />
          {data.website?.trim() && <IconAction icon={Globe} label="Website" />}
        </div>
        {hours.length > 0 && (
          <div className="rounded-xl border bg-card p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
              <Clock className="size-3.5 text-muted-foreground" aria-hidden /> Opening hours
            </p>
            {hours.map((h) => (
              <div key={h.day} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground capitalize">{h.day}</span>
                <span className="font-mono">
                  {h.opens}–{h.closes}
                </span>
              </div>
            ))}
          </div>
        )}
        {data.ctaLabel?.trim() && <PrimaryBtn>{data.ctaLabel}</PrimaryBtn>}
      </Body>
    </div>
  );
}

/* ── 6 · Video — video landing ── */
function VideoScreen({ data, sample }: { data: VideoContent; sample: boolean }) {
  return (
    <div>
      <div className="relative aspect-video w-full">
        {data.thumbnail?.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.thumbnail.previewUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/70 to-primary" />
        )}
        <div className="absolute inset-0 bg-black/25" />
        <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lg">
          <Play className="size-5 translate-x-0.5 fill-primary text-primary" aria-hidden />
        </span>
        {sample && (
          <span className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
            1:32
          </span>
        )}
      </div>
      <Body>
        <p className="text-sm leading-snug font-semibold">{data.title || "Your video"}</p>
        <div className="flex items-center gap-2">
          <Avatar name={sample ? "The QR Gate" : data.title} size={28} />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium">{sample ? "The QR Gate" : "Channel"}</p>
            {sample && <p className="text-[10px] text-muted-foreground">12K views · 2 days ago</p>}
          </div>
        </div>
        {data.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">{data.description}</p>
        )}
        <PrimaryBtn icon={Play}>Watch video</PrimaryBtn>
      </Body>
    </div>
  );
}

/* ── 7 · Images — mobile gallery ── */
function ImagesScreen({ data, sample }: { data: ImagesContent; sample: boolean }) {
  const imgs = data.images.map((i) => i.asset.previewUrl).filter(Boolean) as string[];
  const shown = imgs.length ? imgs : TILES;
  return (
    <div>
      <div className="relative aspect-[4/3] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shown[0]} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-base font-semibold text-white">{data.title || "Gallery"}</p>
          {data.description && <p className="text-[11px] text-white/85">{data.description}</p>}
        </div>
        <span className="absolute top-9 right-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white">
          {shown.length} photos
        </span>
      </div>
      <Body>
        <div className="grid grid-cols-3 gap-1.5">
          {shown.slice(1, 7).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="aspect-square w-full rounded-lg border object-cover" />
          ))}
        </div>
        {sample && <PrimaryBtn icon={ImagesIcon}>View gallery</PrimaryBtn>}
      </Body>
    </div>
  );
}

/* ── 8 · Facebook — page destination ── */
function FacebookScreen({ data, sample }: { data: FacebookContent; sample: boolean }) {
  const url = normalizeFacebookUrl(data.url);
  return (
    <div>
      <Hero height="h-24" scrim={false} />
      <Body className="-mt-8">
        <div className="flex items-end gap-3">
          <Avatar name={data.pageName} size={60} />
          <div className="flex items-center gap-1 pb-1">
            <p className="text-base font-semibold">{data.pageName || "Facebook page"}</p>
            {sample && <BadgeCheck className="size-4 fill-accent text-background" aria-hidden />}
          </div>
        </div>
        {sample && (
          <div className="flex divide-x rounded-xl border bg-card py-2">
            <Metric value="12.4K" label="Likes" />
            <Metric value="12.8K" label="Followers" />
          </div>
        )}
        {data.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">{data.description}</p>
        )}
        <PrimaryBtn icon={SOCIAL_ICONS.facebook} tone="accent">
          Visit Facebook page
        </PrimaryBtn>
        {sample && (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="h-20 bg-gradient-to-br from-accent/50 to-primary" />
            <p className="p-2.5 text-[11px] text-muted-foreground">
              New templates just dropped — scan, style, and share in minutes. 🎉
            </p>
          </div>
        )}
        <p className="text-center text-[10px] text-muted-foreground">
          Opens {url ?? "your Facebook page"} directly
        </p>
      </Body>
    </div>
  );
}

/* ── 9 · Instagram — creator profile ── */
function InstagramScreen({ data, sample }: { data: InstagramContent; sample: boolean }) {
  const handle = normalizeInstagramInput(data.handle)?.replace(/^https:\/\/www\.instagram\.com\//, "@").replace(/\/$/, "");
  return (
    <Body top>
      <div className="flex items-center gap-4">
        <Avatar name={data.title || "IG"} size={64} className="ring-2 ring-accent/60" />
        <div className="flex flex-1 divide-x">
          <Metric value={sample ? "128" : "—"} label="Posts" />
          <Metric value={sample ? "9.2K" : "—"} label="Followers" />
          <Metric value={sample ? "312" : "—"} label="Following" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">{handle || data.handle || "@username"}</p>
        {data.title && <p className="text-xs font-medium">{data.title}</p>}
        {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {TILES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" className="aspect-square w-full object-cover" />
        ))}
      </div>
      <PrimaryBtn icon={SOCIAL_ICONS.instagram}>Open Instagram</PrimaryBtn>
    </Body>
  );
}

/* ── 10 · Social Media — hub ── */
function SocialScreen({ data }: { data: SocialContent; sample: boolean }) {
  const links = data.links.filter((l) => l.url.trim());
  return (
    <Body top className="text-center">
      <div className="flex flex-col items-center gap-2">
        <Avatar src={data.image?.previewUrl} name={data.title} size={60} />
        <p className="text-base font-semibold">{data.title || "Follow us"}</p>
        {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
      </div>
      <div className="space-y-2 pt-1 text-left">
        {links.map((l) => {
          const Icon = SOCIAL_ICONS[l.platform];
          return (
            <div key={l.id} className="flex h-11 items-center gap-3 rounded-xl border bg-card px-3 shadow-sm">
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex-1 truncate text-sm font-medium capitalize">
                {l.label.trim() || l.platform}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </div>
          );
        })}
      </div>
    </Body>
  );
}

/* ── 11 · WhatsApp — chat destination ── */
function WhatsappScreen({ data, sample }: { data: WhatsAppContent; sample: boolean }) {
  const phone = cleanWhatsAppPhone(data.countryCode, data.phone);
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 bg-[#1B8A5B] px-4 pt-11 pb-3 text-white">
        <Avatar name="QR" size={40} className="border-white/40" />
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm font-semibold">
            The QR Gate {sample && <BadgeCheck className="size-3.5 fill-white text-[#1B8A5B]" aria-hidden />}
          </p>
          <p className="font-mono text-[11px] text-white/85">{phone ? `+${phone}` : "your number"}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 bg-[#1B8A5B]/5 p-3">
        {data.message?.trim() ? (
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-card p-2.5 shadow-sm">
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{data.message}</p>
            <p className="mt-1 text-right font-mono text-[9px] text-muted-foreground">pre-filled ·  9:41</p>
          </div>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground">Your pre-filled message appears here.</p>
        )}
      </div>
      <Body className="pt-3">
        <PrimaryBtn icon={MessageCircle} tone="accent">
          Continue to WhatsApp
        </PrimaryBtn>
        <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="size-3" aria-hidden /> Your chat is end-to-end encrypted.
        </p>
      </Body>
    </div>
  );
}

/* ── 12 · MP3 — audio player ── */
function Mp3Screen({ data, sample }: { data: MP3Content; sample: boolean }) {
  return (
    <Body top className="flex min-h-full flex-col items-center">
      <div className="aspect-square w-40 overflow-hidden rounded-2xl border shadow-md">
        {data.cover?.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.cover.previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-accent/70">
            <Volume2 className="size-8 text-white/80" aria-hidden />
          </div>
        )}
      </div>
      <div className="w-full space-y-1 pt-3 text-center">
        <p className="text-sm font-semibold">{data.title || "Track title"}</p>
        {data.artist && <p className="text-xs text-muted-foreground">{data.artist}</p>}
      </div>
      <div className="w-full space-y-1 pt-2">
        <div className="h-1 w-full rounded-full bg-muted">
          <div className="h-full w-1/3 rounded-full bg-primary" />
        </div>
        <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
          <span>1:04</span>
          <span>3:12</span>
        </div>
      </div>
      <div className="flex items-center gap-6 pt-2">
        <SkipBack className="size-5 text-muted-foreground" aria-hidden />
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          {sample ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 translate-x-0.5" aria-hidden />}
        </span>
        <SkipForward className="size-5 text-muted-foreground" aria-hidden />
      </div>
      {data.description && (
        <p className="pt-3 text-center text-[11px] text-muted-foreground">{data.description}</p>
      )}
      {data.allowDownload && (
        <div className="w-full pt-2">
          <GhostBtn icon={Download}>Download audio</GhostBtn>
        </div>
      )}
    </Body>
  );
}

/* ── 13 · Menu — restaurant ── */
const MENU_ITEMS: Record<string, [string, string][]> = {
  Starters: [
    ["Nile mezze board", "£9"],
    ["Charred halloumi", "£7"],
  ],
  Mains: [
    ["Grilled sea bass", "£18"],
    ["Slow-lamb tagine", "£16"],
  ],
  Drinks: [
    ["Hibiscus cooler", "£4"],
    ["Mint lemonade", "£4"],
  ],
};

function MenuScreen({ data, sample }: { data: MenuContent; sample: boolean }) {
  return (
    <div>
      <Hero src={data.logo?.previewUrl} height="h-28">
        <p className="text-lg font-semibold text-white">{data.businessName || data.menuTitle || "Menu"}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-white/85">Restaurant · Egyptian</span>
          {sample && <Chip tone="open">Open</Chip>}
        </div>
      </Hero>
      <Body>
        {data.description && <p className="text-xs text-muted-foreground">{data.description}</p>}
        {sample ? (
          Object.entries(MENU_ITEMS).map(([section, items]) => (
            <div key={section} className="space-y-1.5">
              <SectionLabel>{section}</SectionLabel>
              {items.map(([n, p]) => (
                <div key={n} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium">{n}</span>
                  <span className="flex-1 border-b border-dashed border-border" />
                  <span className="font-mono text-xs">{p}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Your full menu opens on the next screen.</p>
        )}
        <PrimaryBtn icon={UtensilsCrossed}>View full menu</PrimaryBtn>
      </Body>
    </div>
  );
}

/* ── 14 · Apps — app store page ── */
function AppsScreen({ data, sample }: { data: AppsContent; sample: boolean }) {
  return (
    <Body top>
      <div className="flex items-center gap-3">
        <span className="size-16 overflow-hidden rounded-[1.1rem] border shadow-sm">
          {data.icon?.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.icon.previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center bg-gradient-to-br from-accent to-primary font-mono text-lg font-semibold text-white">
              {(data.appName || "A").charAt(0)}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{data.appName || "Your app"}</p>
          {sample && <Stars value={4.9} />}
          <p className="text-[11px] text-muted-foreground">Productivity</p>
        </div>
      </div>
      {data.description && (
        <p className="text-xs leading-relaxed text-muted-foreground">{data.description}</p>
      )}
      {sample && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TILES.slice(0, 3).map((src, i) => (
            <div key={i} className="h-28 w-16 shrink-0 overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {data.appStoreUrl?.trim() && <PrimaryBtn icon={Apple}>Download on the App Store</PrimaryBtn>}
        {data.playStoreUrl?.trim() && <GhostBtn icon={Play}>Get it on Google Play</GhostBtn>}
      </div>
    </Body>
  );
}

/* ── 15 · Coupon — ticket ── */
function CouponScreen({ data, sample }: { data: CouponContent; sample: boolean }) {
  const discount = couponDiscountLabel(data);
  const expired = isCouponExpired(data.expiresAt);
  return (
    <Body top className="flex min-h-full flex-col justify-center">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-md">
        <div className="bg-gradient-to-br from-primary to-accent/80 p-4 text-center text-primary-foreground">
          <Avatar src={data.logo?.previewUrl} name={data.businessName} size={44} className="mx-auto" />
          <p className="mt-2 text-3xl font-semibold tracking-tight">{discount || "20% off"}</p>
          <p className="text-xs opacity-90">{data.title || "Special offer"}</p>
        </div>
        {/* Perforation */}
        <div className="relative">
          <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-background" />
          <div className="mx-4 border-t border-dashed border-border" />
        </div>
        <div className="space-y-2.5 p-4">
          <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/40 px-3 py-2">
            <span className="font-mono text-sm font-semibold tracking-wide">{data.code || "CODE"}</span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-accent">
              <Copy className="size-3.5" aria-hidden /> Copy
            </span>
          </div>
          {data.expiresAt && (
            <p className="text-center font-mono text-[10px] text-muted-foreground">
              {expired ? "Expired" : "Valid until"} {data.expiresAt}
            </p>
          )}
          {!expired && <PrimaryBtn icon={Ticket}>{data.ctaLabel || "Redeem now"}</PrimaryBtn>}
          {(sample || data.terms.trim()) && (
            <p className="text-center text-[9px] leading-relaxed text-muted-foreground">
              {data.terms.trim() || "One per customer. Not valid with other offers."}
            </p>
          )}
        </div>
      </div>
    </Body>
  );
}

/* ── 16 · WiFi — connection ── */
const WIFI_LABELS: Record<WiFiContent["encryption"], string> = {
  WPA: "WPA/WPA2",
  WEP: "WEP",
  nopass: "Open network",
};

function WifiScreen({ data }: { data: WiFiContent; sample: boolean }) {
  return (
    <Body top className="flex min-h-full flex-col items-center justify-center text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-accent/10 ring-8 ring-accent/5">
        <Wifi className="size-9 text-accent" aria-hidden />
      </span>
      <div className="space-y-0.5 pt-1">
        <p className="text-base font-semibold">{data.ssid || "Network name"}</p>
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden /> {WIFI_LABELS[data.encryption]}
        </p>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-[#1B8A5B]/12 px-2.5 py-1 text-[11px] font-medium text-[#1B8A5B]">
        <span className="size-1.5 rounded-full bg-[#1B8A5B]" /> Ready to connect
      </div>
      <div className="w-full space-y-2 pt-1">
        <PrimaryBtn icon={Wifi}>Connect to WiFi</PrimaryBtn>
        {data.encryption !== "nopass" && <GhostBtn icon={Copy}>Copy password</GhostBtn>}
      </div>
      <p className="flex items-center justify-center gap-1 pt-1 text-[10px] text-muted-foreground">
        <ShieldCheck className="size-3" aria-hidden /> Password stays on your device.
      </p>
    </Body>
  );
}

/* ── Dispatcher ── */
export function MobileDestination({ content, sample }: { content: QRContent; sample: boolean }) {
  switch (content.type) {
    case "website":
      return <WebsiteScreen data={content.data} sample={sample} />;
    case "pdf":
      return <PdfScreen data={content.data} sample={sample} />;
    case "links":
      return <LinksScreen data={content.data} sample={sample} />;
    case "vcard":
      return <VcardScreen data={content.data} sample={sample} />;
    case "business":
      return <BusinessScreen data={content.data} sample={sample} />;
    case "video":
      return <VideoScreen data={content.data} sample={sample} />;
    case "images":
      return <ImagesScreen data={content.data} sample={sample} />;
    case "facebook":
      return <FacebookScreen data={content.data} sample={sample} />;
    case "instagram":
      return <InstagramScreen data={content.data} sample={sample} />;
    case "social":
      return <SocialScreen data={content.data} sample={sample} />;
    case "whatsapp":
      return <WhatsappScreen data={content.data} sample={sample} />;
    case "mp3":
      return <Mp3Screen data={content.data} sample={sample} />;
    case "menu":
      return <MenuScreen data={content.data} sample={sample} />;
    case "apps":
      return <AppsScreen data={content.data} sample={sample} />;
    case "coupon":
      return <CouponScreen data={content.data} sample={sample} />;
    case "wifi":
      return <WifiScreen data={content.data} sample={sample} />;
  }
}
