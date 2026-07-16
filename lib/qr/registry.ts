import {
  BadgePercent,
  Building2,
  Contact,
  Facebook,
  FileText,
  Globe,
  Images,
  Instagram,
  List,
  MessageCircle,
  Music,
  Share2,
  Smartphone,
  UtensilsCrossed,
  Video,
  Wifi,
} from "lucide-react";
import { defaultContentFor } from "./defaults";
import type { LucideIcon } from "lucide-react";
import type { QRCategory, QRType, QRTypeDefinition } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * THE single source of truth for the 16 QR types. Components must
 * read names/descriptions/icons/categories from here — never
 * re-declare them. Display order = array order.
 *
 * category: "direct" = the QR encodes the payload itself;
 * "hosted" = the QR points at a published /q/[slug] page.
 * Video/MP3/Menu are hosted by default but produce a direct QR in
 * their URL mode (see requiresPublishing in payloads.ts).
 * ───────────────────────────────────────────────────────────────
 */

const TABLE: ReadonlyArray<[QRType, string, string, QRCategory, LucideIcon]> = [
  ["website", "Website", "Link to any website URL", "direct", Globe],
  ["pdf", "PDF", "Share a PDF document", "hosted", FileText],
  ["links", "List of Links", "Share multiple links in one page", "hosted", List],
  ["vcard", "vCard", "Share a digital contact card", "direct", Contact],
  ["business", "Business", "Share information about your business", "hosted", Building2],
  ["video", "Video", "Share a video", "hosted", Video],
  ["images", "Images", "Share multiple images", "hosted", Images],
  ["facebook", "Facebook", "Share your Facebook page", "direct", Facebook],
  ["instagram", "Instagram", "Share your Instagram profile", "direct", Instagram],
  ["social", "Social Media", "Share all your social channels", "hosted", Share2],
  ["whatsapp", "WhatsApp", "Start a WhatsApp conversation", "direct", MessageCircle],
  ["mp3", "MP3", "Share an audio file", "hosted", Music],
  ["menu", "Menu", "Share a digital menu", "hosted", UtensilsCrossed],
  ["apps", "Apps", "Redirect users to an app store", "hosted", Smartphone],
  ["coupon", "Coupon", "Share a digital coupon", "hosted", BadgePercent],
  ["wifi", "WiFi", "Connect users to a WiFi network", "direct", Wifi],
];

export const QR_TYPES: readonly QRTypeDefinition[] = TABLE.map(
  ([id, name, description, category, icon]) => ({
    id,
    name,
    description,
    category,
    icon,
    defaultContent: defaultContentFor(id),
    implemented: true,
  }),
);

const byId = new Map(QR_TYPES.map((t) => [t.id, t]));

export function getQRType(id: QRType): QRTypeDefinition {
  const def = byId.get(id);
  if (!def) throw new Error(`Unknown QR type: ${id}`);
  return def;
}

export function isQRType(value: string | null | undefined): value is QRType {
  return !!value && byId.has(value as QRType);
}
