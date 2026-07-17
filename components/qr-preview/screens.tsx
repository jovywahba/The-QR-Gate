"use client";

import * as React from "react";
import {
  Apple,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Instagram as InstagramIcon,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Navigation,
  Phone,
  Play,
  ShieldCheck,
  Ticket,
  UserPlus,
  UtensilsCrossed,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { SOCIAL_ICONS } from "@/components/qr-public/shared";
import { couponDiscountLabel, isCouponExpired } from "@/lib/qr/coupon";
import { buildVCardPayload } from "@/lib/qr/payloads";
import { videoEmbed } from "@/lib/qr/preview-capabilities";
import {
  buildWhatsAppPayload,
  cleanWhatsAppPhone,
  normalizeFacebookUrl,
  normalizeInstagramInput,
  normalizeUrl,
} from "@/lib/qr/payloads";
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
import { Avatar, Body, Field, GhostBtn, Hero, IconAction, PrimaryBtn } from "./kit";
import { FacebookEmbed, VimeoEmbed, YouTubeEmbed, facebookPluginUrl } from "./official-embed";
import { AudioPlayer, VideoPlayer, useMediaDuration } from "./media-player";
import { PdfViewer } from "./pdf-viewer";
import { useAppMetadata } from "./use-preview-fetch";
import { WebsiteFrame } from "./website-frame";

/**
 * Real, functional mobile destination screens. Every screen renders
 * ONLY the current content's real fields (or real fixtures on the
 * homepage Live-demo) — real files play, real links open, real
 * metadata is fetched. No fabricated stats, media, or profile data.
 * Where a platform blocks embedding we show an honest open/metadata
 * fallback with the real normalized URL.
 */

/** Honest empty state for a screen with nothing to show yet. */
function Empty({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Body top className="flex min-h-full flex-col items-center justify-center gap-2 text-center">
      <Icon className="size-8 text-muted-foreground/50" aria-hidden />
      <p className="text-xs text-muted-foreground">{children}</p>
    </Body>
  );
}

/** Honest open/metadata fallback for embed-blocked destinations. */
function OpenCard({
  icon: Icon,
  title,
  url,
  note,
  tone = "ink",
  buttonLabel = "Open",
}: {
  icon: LucideIcon;
  title: string;
  url: string;
  note?: string;
  tone?: "ink" | "accent";
  buttonLabel?: string;
}) {
  return (
    <Body top className="flex min-h-full flex-col items-center justify-center gap-3 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl border bg-card">
        <Icon className="size-6 text-foreground" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="font-mono text-[11px] break-all text-muted-foreground">{url}</p>
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="w-full">
        <PrimaryBtn icon={Icon} tone={tone}>
          {buttonLabel}
        </PrimaryBtn>
      </a>
      {note && <p className="text-[10px] leading-relaxed text-muted-foreground">{note}</p>}
    </Body>
  );
}

/* ── Website ── */
function WebsiteScreen({ data }: { data: WebsiteContent }) {
  return <WebsiteFrame data={data} />;
}

/* ── PDF ── */
function PdfScreen({ data }: { data: PDFContent }) {
  return <PdfViewer file={data.file} title={data.title} description={data.description} buttonLabel={data.buttonLabel} />;
}

/* ── List of Links ── */
function LinksScreen({ data }: { data: LinksContent }) {
  const links = data.links.filter((l) => l.label.trim() && normalizeUrl(l.url));
  return (
    <div className="min-h-full bg-gradient-to-b from-secondary to-background">
      <Body top className="text-center">
        <div className="flex flex-col items-center gap-2">
          <Avatar src={data.image?.previewUrl} name={data.title} size={64} />
          {data.title.trim() && <p className="text-base font-semibold">{data.title}</p>}
          {data.description.trim() && <p className="text-xs text-muted-foreground">{data.description}</p>}
        </div>
        {links.length === 0 ? (
          <p className="pt-4 text-xs text-muted-foreground">Add a link and it appears here as a button.</p>
        ) : (
          <div className="space-y-2 pt-1">
            {links.map((l) => (
              <a
                key={l.id}
                href={normalizeUrl(l.url)!}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-between rounded-xl border bg-card px-4 text-sm font-medium shadow-sm"
              >
                <span className="truncate">{l.label}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </a>
            ))}
          </div>
        )}
      </Body>
    </div>
  );
}

/* ── vCard ── */
function VcardScreen({ data }: { data: VCardContent }) {
  const name = [data.firstName, data.lastName].filter((s) => s.trim()).join(" ");
  const role = [data.jobTitle, data.company].filter((s) => s?.trim()).join(" · ");
  const address = [data.street, data.city, data.country].filter((s) => s?.trim()).join(", ");

  const saveContact = () => {
    const vcf = buildVCardPayload(data);
    if (!vcf) return;
    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!name && !role) return <Empty icon={UserPlus}>Enter a name to preview the contact card.</Empty>;

  return (
    <div>
      <div className="relative h-20 bg-gradient-to-br from-accent/80 to-primary" />
      <Body className="-mt-9">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <Avatar name={name} size={64} />
          {name && <p className="text-base font-semibold">{name}</p>}
          {role && <p className="text-xs text-muted-foreground">{role}</p>}
        </div>
        <div className="flex gap-2 pt-1">
          {data.mobile?.trim() && <IconAction icon={Phone} label="Call" />}
          {data.email?.trim() && <IconAction icon={Mail} label="Email" />}
          <button type="button" onClick={saveContact} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UserPlus className="size-4.5" aria-hidden />
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">Save</span>
          </button>
        </div>
        <div className="divide-y rounded-xl border bg-card px-2">
          {data.mobile?.trim() && <Field icon={Phone} label="Mobile" value={data.mobile} />}
          {data.phone?.trim() && <Field icon={Phone} label="Phone" value={data.phone} />}
          {data.email?.trim() && <Field icon={Mail} label="Email" value={data.email} />}
          {data.website?.trim() && <Field icon={Globe} label="Website" value={data.website} />}
          {address && <Field icon={MapPin} label="Address" value={address} />}
        </div>
      </Body>
    </div>
  );
}

/* ── Business ── */
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
function BusinessScreen({ data }: { data: BusinessContent }) {
  const [openNow, setOpenNow] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    // Real open/closed from the entered hours + the viewer's clock.
    const now = new Date();
    const today = data.hours.find((h) => h.day === DAY_KEYS[now.getDay()]);
    if (!today || today.closed) return setOpenNow(false);
    const [oh, om] = today.opens.split(":").map(Number);
    const [ch, cm] = today.closes.split(":").map(Number);
    const mins = now.getHours() * 60 + now.getMinutes();
    setOpenNow(mins >= oh * 60 + om && mins <= ch * 60 + cm);
  }, [data.hours]);

  const address = [data.street, data.city, data.country].filter((s) => s?.trim()).join(", ");
  const mapUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
  const website = data.website.trim() ? normalizeUrl(data.website) : null;
  const socials = data.socials.filter((s) => normalizeUrl(s.url));
  const hours = data.hours.filter((h) => !h.closed);

  if (!data.name.trim()) return <Empty icon={MapPin}>Enter a business name to preview the page.</Empty>;

  return (
    <div>
      <Hero src={data.cover?.previewUrl} height="h-28" />
      <Body className="-mt-8">
        <div className="flex items-end gap-3">
          <Avatar src={data.logo?.previewUrl} name={data.name} size={56} />
          <div className="min-w-0 flex-1 pb-1">
            <p className="truncate text-base font-semibold">{data.name}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {data.category.trim() && <span className="text-[11px] text-muted-foreground">{data.category}</span>}
              {openNow !== null && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${openNow ? "bg-[#1B8A5B]/12 text-[#1B8A5B]" : "bg-muted text-muted-foreground"}`}
                >
                  <span className={`size-1.5 rounded-full ${openNow ? "bg-[#1B8A5B]" : "bg-muted-foreground"}`} />
                  {openNow ? "Open now" : "Closed"}
                </span>
              )}
            </div>
          </div>
        </div>
        {data.headline.trim() && <p className="text-xs font-medium">{data.headline}</p>}
        {data.description.trim() && (
          <p className="text-xs leading-relaxed text-muted-foreground">{data.description}</p>
        )}
        <div className="flex gap-2">
          {data.phone.trim() && <IconAction icon={Phone} label="Call" />}
          {mapUrl && <IconAction icon={Navigation} label="Directions" />}
          {website && <IconAction icon={Globe} label="Website" />}
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
        {data.ctaLabel.trim() && normalizeUrl(data.ctaUrl) && <PrimaryBtn>{data.ctaLabel}</PrimaryBtn>}
        {socials.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {socials.map((s) => {
              const Icon = SOCIAL_ICONS[s.platform];
              return (
                <span key={s.id} className="flex size-9 items-center justify-center rounded-full border bg-card">
                  <Icon className="size-4" aria-hidden />
                </span>
              );
            })}
          </div>
        )}
      </Body>
    </div>
  );
}

/* ── Video ── */
function VideoScreen({ data }: { data: VideoContent }) {
  if (data.mode === "upload") {
    if (!data.file?.previewUrl) return <Empty icon={Play}>Upload a video to preview it here.</Empty>;
    return (
      <div>
        <VideoPlayer src={data.file.previewUrl} poster={data.thumbnail?.previewUrl} />
        <Body>
          {data.title.trim() && <p className="text-sm font-semibold">{data.title}</p>}
          {data.description.trim() && <p className="text-xs text-muted-foreground">{data.description}</p>}
        </Body>
      </div>
    );
  }
  const embed = videoEmbed({ type: "video", data });
  if (embed) {
    return (
      <div>
        {embed.provider === "youtube" ? (
          <YouTubeEmbed embedUrl={embed.embedUrl} title={data.title || "Video"} />
        ) : (
          <VimeoEmbed embedUrl={embed.embedUrl} title={data.title || "Video"} />
        )}
        <Body>
          {data.title.trim() && <p className="text-sm font-semibold">{data.title}</p>}
          {data.description.trim() && <p className="text-xs text-muted-foreground">{data.description}</p>}
        </Body>
      </div>
    );
  }
  const url = normalizeUrl(data.videoUrl);
  if (!url) return <Empty icon={Play}>Add a video URL to preview it here.</Empty>;
  return <OpenCard icon={Play} title={data.title || "Video"} url={url} buttonLabel="Watch video" />;
}

/* ── Images ── */
function ImagesScreen({ data }: { data: ImagesContent }) {
  const imgs = data.images
    .map((i) => ({ url: i.asset.previewUrl, caption: i.caption }))
    .filter((i) => i.url) as { url: string; caption: string }[];
  if (imgs.length === 0) return <Empty icon={Globe}>Upload images to preview the gallery.</Empty>;
  const ctaUrl = data.ctaLabel.trim() && data.ctaUrl.trim() ? normalizeUrl(data.ctaUrl) : null;
  return (
    <div>
      <div className="relative aspect-[4/3] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[0].url} alt={imgs[0].caption || "Image 1"} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          {data.title.trim() && <p className="text-base font-semibold text-white">{data.title}</p>}
          {imgs[0].caption.trim() && <p className="text-[11px] text-white/85">{imgs[0].caption}</p>}
        </div>
        <span className="absolute top-9 right-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white">
          {imgs.length} {imgs.length === 1 ? "photo" : "photos"}
        </span>
      </div>
      <Body>
        {data.description.trim() && <p className="text-xs text-muted-foreground">{data.description}</p>}
        {imgs.length > 1 && (
          <div className="grid grid-cols-3 gap-1.5">
            {imgs.slice(1).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.url}
                alt={img.caption || `Image ${i + 2}`}
                className="aspect-square w-full rounded-lg border object-cover"
              />
            ))}
          </div>
        )}
        {ctaUrl && (
          <a href={ctaUrl} target="_blank" rel="noreferrer">
            <PrimaryBtn>{data.ctaLabel}</PrimaryBtn>
          </a>
        )}
      </Body>
    </div>
  );
}

/* ── Facebook ── */
function FacebookScreen({ data }: { data: FacebookContent }) {
  const url = normalizeFacebookUrl(data.url);
  if (!url) return <Empty icon={SOCIAL_ICONS.facebook}>Add your Facebook page URL to preview it.</Empty>;
  // Official Page Plugin for public pages; honest open fallback otherwise.
  if (facebookPluginUrl(url)) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="px-3 pt-10 pb-2">
          <p className="text-sm font-semibold">{data.pageName.trim() || "Facebook page"}</p>
        </div>
        <FacebookEmbed pageUrl={url} />
        <Body>
          <a href={url} target="_blank" rel="noreferrer">
            <PrimaryBtn icon={SOCIAL_ICONS.facebook} tone="accent">
              Open Facebook page
            </PrimaryBtn>
          </a>
        </Body>
      </div>
    );
  }
  return (
    <OpenCard
      icon={SOCIAL_ICONS.facebook}
      title={data.pageName.trim() || "Facebook page"}
      url={url}
      tone="accent"
      buttonLabel="Open Facebook page"
    />
  );
}

/* ── Instagram (profiles block embedding — honest fallback) ── */
function InstagramScreen({ data }: { data: InstagramContent }) {
  const url = normalizeInstagramInput(data.handle);
  if (!url) return <Empty icon={InstagramIcon}>Add your Instagram username to preview it.</Empty>;
  const username = url.replace(/^https:\/\/www\.instagram\.com\//, "@").replace(/\/$/, "");
  return (
    <OpenCard
      icon={InstagramIcon}
      title={data.title.trim() || username}
      url={url}
      buttonLabel="Open Instagram profile"
      note="Instagram doesn't allow full profile embedding, so this opens the real profile."
    />
  );
}

/* ── Social Media ── */
function SocialScreen({ data }: { data: SocialContent }) {
  const links = data.links.filter((l) => normalizeUrl(l.url));
  return (
    <Body top className="text-center">
      <div className="flex flex-col items-center gap-2">
        <Avatar src={data.image?.previewUrl} name={data.title} size={60} />
        {data.title.trim() && <p className="text-base font-semibold">{data.title}</p>}
        {data.description.trim() && <p className="text-xs text-muted-foreground">{data.description}</p>}
      </div>
      {links.length === 0 ? (
        <p className="pt-4 text-xs text-muted-foreground">Add a social link and it appears here.</p>
      ) : (
        <div className="space-y-2 pt-1 text-left">
          {links.map((l) => {
            const Icon = SOCIAL_ICONS[l.platform];
            return (
              <a
                key={l.id}
                href={normalizeUrl(l.url)!}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center gap-3 rounded-xl border bg-card px-3 shadow-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1 truncate text-sm font-medium capitalize">{l.label.trim() || l.platform}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </a>
            );
          })}
        </div>
      )}
    </Body>
  );
}

/* ── WhatsApp ── */
function WhatsappScreen({ data }: { data: WhatsAppContent }) {
  const phone = cleanWhatsAppPhone(data.countryCode, data.phone);
  const chatUrl = buildWhatsAppPayload(data);
  if (!phone) return <Empty icon={MessageCircle}>Add a phone number to preview the chat.</Empty>;
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 bg-[#1B8A5B] px-4 pt-11 pb-3 text-white">
        <Avatar name={phone} size={40} className="border-white/40" />
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">+{phone}</p>
          <p className="text-[11px] text-white/85">WhatsApp</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 bg-[#1B8A5B]/5 p-3">
        {data.message?.trim() ? (
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-card p-2.5 shadow-sm">
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{data.message}</p>
            <p className="mt-1 text-right font-mono text-[9px] text-muted-foreground">pre-filled</p>
          </div>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground">
            No pre-filled message — scanning just opens the chat.
          </p>
        )}
      </div>
      <Body className="pt-3">
        {chatUrl && (
          <a href={chatUrl} target="_blank" rel="noreferrer">
            <PrimaryBtn icon={MessageCircle} tone="accent">
              Continue to WhatsApp
            </PrimaryBtn>
          </a>
        )}
        <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="size-3" aria-hidden /> Opens WhatsApp with your message ready to send.
        </p>
      </Body>
    </div>
  );
}

/* ── MP3 ── */
function Mp3Screen({ data }: { data: MP3Content }) {
  const [duration, setDuration] = useMediaDuration();
  const src = data.mode === "upload" ? data.file?.previewUrl : normalizeUrl(data.audioUrl);
  if (!src) return <Empty icon={Music}>Add an audio file or URL to preview the player.</Empty>;
  return (
    <Body top className="flex min-h-full flex-col items-center">
      <div className="aspect-square w-40 overflow-hidden rounded-2xl border shadow-md">
        {data.cover?.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.cover.previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-accent/70">
            <Music className="size-8 text-white/80" aria-hidden />
          </div>
        )}
      </div>
      <div className="w-full space-y-0.5 pt-3 text-center">
        {data.title.trim() && <p className="text-sm font-semibold">{data.title}</p>}
        <p className="text-xs text-muted-foreground">
          {data.artist.trim()}
          {data.artist.trim() && duration ? " · " : ""}
          {duration}
        </p>
      </div>
      <div className="w-full pt-3">
        <AudioPlayer src={src} onDuration={setDuration} />
      </div>
      {data.description.trim() && (
        <p className="pt-3 text-center text-[11px] text-muted-foreground">{data.description}</p>
      )}
      {data.allowDownload && data.mode === "upload" && data.file?.previewUrl && (
        <a href={data.file.previewUrl} download={data.file.fileName} className="w-full pt-2">
          <GhostBtn icon={Music}>Download audio</GhostBtn>
        </a>
      )}
    </Body>
  );
}

/* ── Menu ── */
function MenuScreen({ data }: { data: MenuContent }) {
  const title = data.businessName.trim() || data.menuTitle.trim();
  if (data.mode === "pdf") {
    return <PdfViewer file={data.file} title={title || "Menu"} description={data.description} buttonLabel="View menu" />;
  }
  const url = normalizeUrl(data.menuUrl);
  if (!url) return <Empty icon={UtensilsCrossed}>Add a menu PDF or URL to preview it.</Empty>;
  return (
    <OpenCard icon={UtensilsCrossed} title={title || "Menu"} url={url} buttonLabel="Open menu" />
  );
}

/* ── Apps ── */
function AppsScreen({ data }: { data: AppsContent }) {
  // Real Apple metadata when the store URL resolves; else entered values.
  const { data: meta } = useAppMetadata(data.appStoreUrl.trim() ? data.appStoreUrl : null);
  const name = meta?.found && meta.name ? meta.name : data.appName;
  const icon = meta?.found && meta.icon ? meta.icon : data.icon?.previewUrl;
  const description = meta?.found && meta.description ? meta.description : data.description;
  const genre = meta?.found ? meta.genre : null;
  const rating = meta?.found ? meta.rating : null;

  const stores = [
    { url: normalizeUrl(data.appStoreUrl), label: "Download on the App Store", icon: Apple },
    { url: normalizeUrl(data.playStoreUrl), label: "Get it on Google Play", icon: Play },
    { url: normalizeUrl(data.websiteUrl), label: "Visit the website", icon: Globe },
  ].filter((s) => s.url);

  if (!name.trim() && stores.length === 0) {
    return <Empty icon={Globe}>Add an app name and store link to preview.</Empty>;
  }
  return (
    <Body top>
      <div className="flex items-center gap-3">
        <span className="size-16 overflow-hidden rounded-[1.1rem] border shadow-sm">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center bg-gradient-to-br from-accent to-primary font-mono text-lg font-semibold text-white">
              {(name || "A").charAt(0)}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name || "Your app"}</p>
          <p className="text-[11px] text-muted-foreground">
            {[genre, rating != null ? `★ ${rating}` : null].filter(Boolean).join(" · ") || " "}
          </p>
        </div>
      </div>
      {description.trim() && (
        <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="space-y-2">
        {stores.map((s, i) =>
          i === 0 ? (
            <a key={s.label} href={s.url!} target="_blank" rel="noreferrer">
              <PrimaryBtn icon={s.icon}>{s.label}</PrimaryBtn>
            </a>
          ) : (
            <a key={s.label} href={s.url!} target="_blank" rel="noreferrer">
              <GhostBtn icon={s.icon}>{s.label}</GhostBtn>
            </a>
          ),
        )}
      </div>
    </Body>
  );
}

/* ── Coupon ── */
function CouponScreen({ data }: { data: CouponContent }) {
  const [copied, setCopied] = React.useState(false);
  const discount = couponDiscountLabel(data);
  const expired = isCouponExpired(data.expiresAt);
  const redeemUrl = data.redemptionUrl?.trim() ? normalizeUrl(data.redemptionUrl) : null;
  if (!data.title.trim() && !data.code.trim()) {
    return <Empty icon={Ticket}>Enter a coupon title and code to preview it.</Empty>;
  }
  const copy = async () => {
    if (!data.code.trim()) return;
    try {
      await navigator.clipboard.writeText(data.code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <Body top className="flex min-h-full flex-col justify-center">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-md">
        <div className="bg-gradient-to-br from-primary to-accent/80 p-4 text-center text-primary-foreground">
          <Avatar src={data.logo?.previewUrl} name={data.businessName} size={44} className="mx-auto" />
          {discount && <p className="mt-2 text-3xl font-semibold tracking-tight">{discount}</p>}
          {data.title.trim() && <p className="text-xs opacity-90">{data.title}</p>}
        </div>
        <div className="relative">
          <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-background" />
          <div className="mx-4 border-t border-dashed border-border" />
        </div>
        <div className="space-y-2.5 p-4">
          {data.code.trim() && (
            <button
              type="button"
              onClick={copy}
              className="flex w-full items-center justify-between rounded-lg border border-dashed bg-muted/40 px-3 py-2"
            >
              <span className="font-mono text-sm font-semibold tracking-wide">{data.code}</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-accent">
                <Copy className="size-3.5" aria-hidden /> {copied ? "Copied" : "Copy"}
              </span>
            </button>
          )}
          {data.expiresAt && (
            <p className="text-center font-mono text-[10px] text-muted-foreground">
              {expired ? "Expired" : "Valid until"} {data.expiresAt}
            </p>
          )}
          {!expired &&
            (redeemUrl ? (
              <a href={redeemUrl} target="_blank" rel="noreferrer">
                <PrimaryBtn icon={Ticket}>{data.ctaLabel.trim() || "Redeem now"}</PrimaryBtn>
              </a>
            ) : (
              <PrimaryBtn icon={Ticket}>{data.ctaLabel.trim() || "Redeem now"}</PrimaryBtn>
            ))}
          {data.terms.trim() && (
            <p className="text-center text-[9px] leading-relaxed text-muted-foreground">{data.terms}</p>
          )}
        </div>
      </div>
    </Body>
  );
}

/* ── WiFi (password hidden by default) ── */
const WIFI_LABELS: Record<WiFiContent["encryption"], string> = {
  WPA: "WPA/WPA2",
  WEP: "WEP",
  nopass: "Open network",
};
function WifiScreen({ data }: { data: WiFiContent }) {
  const [reveal, setReveal] = React.useState(false);
  if (!data.ssid.trim()) return <Empty icon={Wifi}>Enter a network name to preview the WiFi page.</Empty>;
  return (
    <Body top className="flex min-h-full flex-col items-center justify-center text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-accent/10 ring-8 ring-accent/5">
        <Wifi className="size-9 text-accent" aria-hidden />
      </span>
      <div className="space-y-0.5 pt-1">
        <p className="text-base font-semibold">{data.ssid}</p>
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden /> {WIFI_LABELS[data.encryption]}
        </p>
      </div>
      <div className="w-full space-y-2 pt-1">
        <PrimaryBtn icon={Wifi}>Connect to WiFi</PrimaryBtn>
        {data.encryption !== "nopass" && data.password && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium"
          >
            {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {reveal ? data.password : "Show password"}
          </button>
        )}
      </div>
      <p className="flex items-center justify-center gap-1 pt-1 text-[10px] text-muted-foreground">
        <ShieldCheck className="size-3" aria-hidden /> Scanning connects automatically — no typing needed.
      </p>
    </Body>
  );
}

/* ── Dispatcher ── */
export function MobileDestination({ content }: { content: QRContent }) {
  switch (content.type) {
    case "website":
      return <WebsiteScreen data={content.data} />;
    case "pdf":
      return <PdfScreen data={content.data} />;
    case "links":
      return <LinksScreen data={content.data} />;
    case "vcard":
      return <VcardScreen data={content.data} />;
    case "business":
      return <BusinessScreen data={content.data} />;
    case "video":
      return <VideoScreen data={content.data} />;
    case "images":
      return <ImagesScreen data={content.data} />;
    case "facebook":
      return <FacebookScreen data={content.data} />;
    case "instagram":
      return <InstagramScreen data={content.data} />;
    case "social":
      return <SocialScreen data={content.data} />;
    case "whatsapp":
      return <WhatsappScreen data={content.data} />;
    case "mp3":
      return <Mp3Screen data={content.data} />;
    case "menu":
      return <MenuScreen data={content.data} />;
    case "apps":
      return <AppsScreen data={content.data} />;
    case "coupon":
      return <CouponScreen data={content.data} />;
    case "wifi":
      return <WifiScreen data={content.data} />;
  }
}
