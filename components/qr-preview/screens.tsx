"use client";

import * as React from "react";
import {
  Apple,
  Building2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Heart,
  Image as ImageIcon,
  Instagram as InstagramIcon,
  Link2,
  Lock,
  MapPin,
  MessageCircle,
  Music,
  Navigation,
  Phone,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket,
  User2,
  UserPlus,
  UtensilsCrossed,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { SOCIAL_ICONS } from "@/components/qr-public/shared";
import { formatBytes } from "@/components/qr-public/resolver";
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
import { cn } from "@/lib/utils";
import { Avatar, Body, GhostBtn, Hero, IconAction, PrimaryBtn } from "./kit";
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

/* ═══ Premium destination primitives (match the reference mockups) ═══
   Warm, themed destination pages — decorative gradient backgrounds, soft
   blobs, display headings, fanned photos, and colored brand rows. All are
   driven by REAL content (demo fixtures on hover, the user's own data in
   the builder). No fabricated stats or media. */

type Palette = {
  grad: string;
  blobA: string;
  blobB: string;
  heading: string;
  sub: string;
  chip: string;
  btn: string;
};

const PEACH: Palette = {
  grad: "from-[#FCE9DD] via-[#FDF3EC] to-[#FDF8F3]",
  blobA: "bg-[#F6C4A6]",
  blobB: "bg-[#FAD9BE]",
  heading: "text-[#2b2b33]",
  sub: "text-[#6b675c]",
  chip: "text-[#E8734A]",
  btn: "bg-[#EA7A50] text-white",
};
const CREAM: Palette = {
  grad: "from-[#F4EADC] via-[#FAF3E9] to-[#F8F1E7]",
  blobA: "bg-[#E7C79C]",
  blobB: "bg-[#EBD6B4]",
  heading: "text-[#3d3020]",
  sub: "text-[#6b5c45]",
  chip: "text-[#C08A4E]",
  btn: "bg-[#C08A4E] text-white",
};
const CORAL: Palette = {
  grad: "from-[#F7CBC3] via-[#FBEBE5] to-[#FBF4EF]",
  blobA: "bg-[#F1A79D]",
  blobB: "bg-[#F6C7BE]",
  heading: "text-[#2b2b33]",
  sub: "text-[#6b675c]",
  chip: "text-[#E8734A]",
  btn: "bg-[#E8734A] text-white",
};
const TEAL: Palette = {
  grad: "from-[#CDECE6] via-[#E6F5F1] to-[#F5FBFA]",
  blobA: "bg-[#A9DED4]",
  blobB: "bg-[#C6EBE3]",
  heading: "text-[#123b45]",
  sub: "text-[#4a6b70]",
  chip: "text-[#16897f]",
  btn: "bg-gradient-to-r from-[#2AA8A0] to-[#1E8E8E] text-white",
};

/** Themed page with soft decorative blobs (the mockups' organic backdrop). */
function Shell({ palette, children }: { palette: Palette; children: React.ReactNode }) {
  return (
    <div className={cn("relative min-h-full overflow-hidden bg-gradient-to-b", palette.grad)}>
      <span aria-hidden className={cn("pointer-events-none absolute -top-14 -left-12 size-44 rounded-full opacity-50 blur-3xl", palette.blobA)} />
      <span aria-hidden className={cn("pointer-events-none absolute top-24 -right-16 size-40 rounded-full opacity-40 blur-3xl", palette.blobB)} />
      <span aria-hidden className={cn("pointer-events-none absolute -bottom-12 -left-10 size-40 rounded-full opacity-30 blur-3xl", palette.blobA)} />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Three real photos fanned like the mockups (front centered, two behind). */
function PhotoFan({ images }: { images: string[] }) {
  const [front, left, right] = [images[0], images[1] ?? images[0], images[2] ?? images[1] ?? images[0]];
  return (
    <div className="relative mx-auto flex h-48 w-full max-w-[230px] items-center justify-center">
      {left && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={left} alt="" className="absolute left-0 top-7 h-32 w-[84px] -rotate-[10deg] rounded-2xl border-[3px] border-white object-cover shadow-lg" />
      )}
      {right && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={right} alt="" className="absolute right-0 top-7 h-32 w-[84px] rotate-[10deg] rounded-2xl border-[3px] border-white object-cover shadow-lg" />
      )}
      {front && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={front} alt="" className="relative z-10 h-44 w-[130px] rounded-[1.4rem] border-[3px] border-white object-cover shadow-xl" />
      )}
    </div>
  );
}

/** Brand-colored circular badge behind a social icon. */
const BRAND_BADGE: Record<string, string> = {
  facebook: "bg-[#1877F2]",
  instagram: "bg-[linear-gradient(45deg,#F9CE34,#EE2A7B_45%,#6228D7)]",
  youtube: "bg-[#FF0000]",
  x: "bg-black",
  linkedin: "bg-[#0A66C2]",
  tiktok: "bg-black",
  whatsapp: "bg-[#25D366]",
  telegram: "bg-[#229ED9]",
  website: "bg-primary",
};

/** A colored social/brand row (Facebook · Instagram · YouTube …). */
function BrandRow({
  platform,
  label,
  chevron,
  url,
}: {
  platform: keyof typeof SOCIAL_ICONS;
  label: string;
  chevron: string;
  url: string;
}) {
  const Icon = SOCIAL_ICONS[platform];
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3.5 rounded-[1.15rem] bg-white/90 px-4 py-3 shadow-sm backdrop-blur"
    >
      <span className={cn("flex size-12 items-center justify-center rounded-full text-white", BRAND_BADGE[platform] ?? "bg-primary")}>
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold capitalize text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">Social Account</p>
      </div>
      <ChevronRight className={cn("size-5 shrink-0", chevron)} aria-hidden />
    </a>
  );
}

/** A rounded white detail row (Contact Info · Company · About …). */
function DetailRow({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3.5 shadow-sm">
      <span className="flex size-11 items-center justify-center rounded-full bg-[#D5F0EB] text-[#16897f]">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="flex-1 text-[15px] font-semibold text-[#123b45]">{title}</p>
      <ChevronRight className="size-5 text-[#9fbcbf]" aria-hidden />
    </div>
  );
}

/** A big pill CTA used across the premium screens. */
function PillBtn({
  icon: Icon,
  className,
  children,
}: {
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-[15px] font-bold shadow-md",
        className,
      )}
    >
      {Icon && <Icon className="size-5" aria-hidden />}
      {children}
    </span>
  );
}

/* ── Website ── */
function WebsiteScreen({ data }: { data: WebsiteContent }) {
  return <WebsiteFrame data={data} />;
}

/* ── PDF (Creative Portfolio) ── */
function PdfScreen({ data }: { data: PDFContent }) {
  const file = data.file;
  if (!file?.previewUrl) {
    // No file yet → the plain viewer shows the honest empty/config state.
    return <PdfViewer file={file} title={data.title} description={data.description} buttonLabel={data.buttonLabel} />;
  }
  const title = data.title.trim() || "Document";
  return (
    <div className="min-h-full bg-gradient-to-b from-[#0e2440] via-[#0e2440] to-[#f2efe8]">
      <div className="px-5 pt-12 text-center text-white">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-white/25">
          <FileText className="size-5 text-[#d9b979]" aria-hidden />
        </span>
        <p className="mt-3 font-mono text-[10px] tracking-[0.22em] text-[#d9b979] uppercase">Document Preview</p>
        <h1 className="mt-1 font-serif text-[28px] leading-tight font-bold">{title}</h1>
        {data.description.trim() && (
          <p className="mx-auto mt-2 max-w-[16rem] text-[13px] leading-snug text-white/70">{data.description}</p>
        )}
      </div>
      <div className="mt-5 px-4 pb-9">
        <div className="rounded-[1.5rem] bg-[#f7f5ef] p-4 shadow-2xl">
          <div className="overflow-hidden rounded-2xl border bg-white">
            <object
              data={`${file.previewUrl}#toolbar=0&view=FitH`}
              type="application/pdf"
              className="h-56 w-full"
              aria-label={title}
            >
              <div className="flex h-56 items-center justify-center">
                <FileText className="size-10 text-muted-foreground" aria-hidden />
              </div>
            </object>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-[#E4342E] font-mono text-[10px] font-bold text-white">
              PDF
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#0e2440]">{file.fileName}</p>
              <p className="text-[11px] text-muted-foreground">{formatBytes(file.fileSize) || "PDF document"}</p>
            </div>
          </div>
          {data.description.trim() && (
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#eaeef3] p-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-[#0e2440]" aria-hidden />
              <p className="text-[12px] leading-snug text-[#3a4a5a]">{data.description}</p>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <a href={file.previewUrl} target="_blank" rel="noreferrer">
              <PillBtn icon={Eye} className="h-12 bg-[#0e2440] text-white">
                {data.buttonLabel?.trim() || "Open PDF"}
              </PillBtn>
            </a>
            <a href={file.previewUrl} download={file.fileName}>
              <PillBtn icon={Download} className="h-12 border border-[#0e2440]/25 bg-white text-[#0e2440]">
                Download
              </PillBtn>
            </a>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <Lock className="size-3" aria-hidden /> Secure PDF Preview · Your privacy is protected
          </p>
        </div>
      </div>
    </div>
  );
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

  const hasContact = Boolean(data.mobile?.trim() || data.phone?.trim() || data.email?.trim() || address);
  const hasCompany = Boolean(data.company?.trim());
  const hasAbout = Boolean(data.note?.trim());
  const hasSocial = Boolean(data.website?.trim());

  return (
    <Shell palette={TEAL}>
      <div className="px-5 pt-14 pb-9">
        <div className="flex flex-col items-center text-center">
          <Avatar name={name} size={112} className="border-4 border-white shadow-lg" />
          {name && <h1 className="mt-4 text-[26px] leading-tight font-extrabold text-[#123b45]">{name}</h1>}
          {role && <p className="mt-0.5 text-[15px] text-[#4a6b70]">{role}</p>}
        </div>
        <button type="button" onClick={saveContact} className="mt-6 block w-full">
          <PillBtn icon={Download} className={cn("h-[52px]", TEAL.btn)}>
            Save Contact
          </PillBtn>
        </button>
        <div className="mt-6 space-y-3">
          {hasContact && <DetailRow icon={Phone} title="Contact Info" />}
          {hasCompany && <DetailRow icon={Building2} title="Company" />}
          {hasAbout && <DetailRow icon={User2} title="About" />}
          {hasSocial && <DetailRow icon={Link2} title="Social Links" />}
        </div>
      </div>
    </Shell>
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

/* ── Video (My Moments) ── */
function VideoScreen({ data }: { data: VideoContent }) {
  let player: React.ReactNode = null;
  if (data.mode === "upload") {
    if (!data.file?.previewUrl) return <Empty icon={Play}>Upload a video to preview it here.</Empty>;
    player = <VideoPlayer src={data.file.previewUrl} poster={data.thumbnail?.previewUrl} />;
  } else {
    const embed = videoEmbed({ type: "video", data });
    if (embed) {
      player =
        embed.provider === "youtube" ? (
          <YouTubeEmbed embedUrl={embed.embedUrl} title={data.title || "Video"} />
        ) : (
          <VimeoEmbed embedUrl={embed.embedUrl} title={data.title || "Video"} />
        );
    } else {
      const url = normalizeUrl(data.videoUrl);
      if (!url) return <Empty icon={Play}>Add a video URL to preview it here.</Empty>;
      return <OpenCard icon={Play} title={data.title || "Video"} url={url} buttonLabel="Watch video" />;
    }
  }
  const title = data.title.trim() || "My Video";
  return (
    <Shell palette={PEACH}>
      <div className="px-5 pt-14 pb-9">
        <div className="text-center">
          <h1 className="text-[30px] leading-tight font-extrabold text-[#2b2b33]">{title}</h1>
          {data.description.trim() && (
            <p className="mx-auto mt-2 max-w-[16rem] text-[14px] leading-snug text-[#6b675c]">{data.description}</p>
          )}
        </div>
        <div className="mt-5 overflow-hidden rounded-[1.4rem] border-[3px] border-white shadow-lg">{player}</div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FBE0D2] text-[#E8734A]">
            <Play className="size-5 fill-current" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-[#2b2b33]">{title}</p>
            {data.description.trim() && <p className="truncate text-[12px] text-[#6b675c]">{data.description}</p>}
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px] text-[#8a857a]">
          <Heart className="size-3.5 fill-[#E8734A] text-[#E8734A]" aria-hidden /> Every moment has a story.
        </p>
      </div>
    </Shell>
  );
}

/* ── Images (Image Collection) ── */
function ImagesScreen({ data }: { data: ImagesContent }) {
  const imgs = data.images.map((i) => i.asset.previewUrl).filter(Boolean) as string[];
  if (imgs.length === 0) return <Empty icon={ImageIcon}>Upload images to preview the gallery.</Empty>;
  const ctaUrl = data.ctaLabel.trim() && data.ctaUrl.trim() ? normalizeUrl(data.ctaUrl) : null;
  const title = data.title.trim() || "Image Collection";
  return (
    <Shell palette={CREAM}>
      <div className="px-5 pt-14 pb-9 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white shadow-sm">
          <ImageIcon className="size-6 text-[#C08A4E]" aria-hidden />
        </span>
        <h1 className="mt-4 font-serif text-[28px] leading-tight font-bold text-[#3d3020]">{title}</h1>
        {data.description.trim() && (
          <p className="mx-auto mt-1.5 max-w-[16rem] text-[14px] text-[#6b5c45]">{data.description}</p>
        )}
        <div className="my-4 flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-[#D9B98C]" />
          <Sparkles className="size-3.5 text-[#C08A4E]" aria-hidden />
          <span className="h-px w-8 bg-[#D9B98C]" />
        </div>
        <PhotoFan images={imgs} />
        <div className="mt-7 flex items-center gap-2.5">
          {ctaUrl ? (
            <a href={ctaUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
              <PillBtn icon={ImageIcon} className={cn("h-[52px]", CREAM.btn)}>
                {data.ctaLabel}
              </PillBtn>
            </a>
          ) : (
            <span className="min-w-0 flex-1">
              <PillBtn icon={ImageIcon} className={cn("h-[52px]", CREAM.btn)}>
                View Gallery
              </PillBtn>
            </span>
          )}
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-white text-[#C08A4E] shadow-sm">
            <Share2 className="size-5" aria-hidden />
          </span>
        </div>
      </div>
    </Shell>
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

/* ── Social Media (Creative Socials) ── */
function SocialScreen({ data }: { data: SocialContent }) {
  const links = data.links.filter((l) => normalizeUrl(l.url));
  const title = data.title.trim() || "Creative Socials";
  return (
    <Shell palette={CORAL}>
      <div className="px-5 pt-12 pb-9">
        {data.image?.previewUrl && (
          <div className="mx-auto mb-5 h-40 w-[132px] overflow-hidden rounded-[1.4rem] border-[3px] border-white shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.image.previewUrl} alt="" className="size-full object-cover" />
          </div>
        )}
        <div className="text-center">
          <h1 className="font-serif text-[28px] leading-tight font-bold text-[#2b2b33]">{title}</h1>
          <div className="my-3 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-[#E9A99F]" />
            <Heart className="size-4 fill-[#E8734A] text-[#E8734A]" aria-hidden />
            <span className="h-px w-8 bg-[#E9A99F]" />
          </div>
          {data.description.trim() && (
            <p className="mx-auto max-w-[17rem] text-[14px] leading-snug text-[#6b675c]">{data.description}</p>
          )}
        </div>
        {links.length === 0 ? (
          <p className="pt-5 text-center text-xs text-muted-foreground">Add a social link and it appears here.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {links.map((l) => (
              <BrandRow
                key={l.id}
                platform={l.platform}
                label={l.label.trim() || l.platform}
                chevron={CORAL.chip}
                url={normalizeUrl(l.url)!}
              />
            ))}
          </div>
        )}
      </div>
    </Shell>
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
