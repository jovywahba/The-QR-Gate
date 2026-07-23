import type { QRType } from "./types";

/**
 * ───────────────────────────────────────────────────────────────
 * QR FRAMES — original artwork that wraps the REAL QR code.
 *
 * A frame is declarative: `layout()` returns the artwork box, where
 * the QR sits inside it, and a list of drawing primitives. ONE spec
 * drives every surface — live preview, PNG canvas, and true-vector
 * SVG — so what you see is exactly what downloads (composition.ts).
 *
 * Scan safety is structural: primitives are only ever emitted OUTSIDE
 * the QR rect, so the code's quiet zone (rendered inside the QR canvas
 * itself) is never covered.
 * ───────────────────────────────────────────────────────────────
 */

export type FramePrimitive =
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      rx?: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      kind: "text";
      x: number;
      /** Vertical CENTER of the text (canvas: middle baseline, SVG: central). */
      y: number;
      text: string;
      size: number;
      weight: number;
      fill: string;
      anchor: "start" | "middle" | "end";
      tracking?: number;
    }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string };

export type FrameColors = {
  /** Card / artwork surface. */
  background: string;
  /** Borders, bars, accents. */
  foreground: string;
  /** CTA text drawn on `foreground`. */
  text: string;
};

export type FrameLayout = {
  width: number;
  height: number;
  /** Where the real QR canvas/SVG is placed. Nothing is drawn over it. */
  qr: { x: number; y: number; size: number };
  /** Drawn before the QR. */
  back: FramePrimitive[];
  /** Drawn after the QR (never inside the QR rect). */
  front: FramePrimitive[];
};

export type FrameLayoutArgs = { qrSize: number; text: string; colors: FrameColors };

export type QRFrameCategory = "simple" | "cta" | "business" | "creative";

export type QRFrame = {
  id: string;
  name: string;
  category: QRFrameCategory;
  /** Does this frame render CTA text the user can edit? */
  hasText: boolean;
  /** Used when the user hasn't typed their own text. */
  defaultText: string;
  layout: (args: FrameLayoutArgs) => FrameLayout;
};

export const MAX_FRAME_TEXT = 30;

/* ── Smart CTA defaults per QR type (spec §11) ── */
const TYPE_TEXT: Record<QRType, string> = {
  website: "VISIT WEBSITE",
  pdf: "VIEW PDF",
  links: "VIEW LINKS",
  vcard: "SAVE CONTACT",
  business: "LEARN MORE",
  video: "WATCH VIDEO",
  images: "VIEW GALLERY",
  facebook: "VISIT FACEBOOK",
  instagram: "FOLLOW US",
  social: "FOLLOW US",
  whatsapp: "CHAT WITH US",
  mp3: "LISTEN NOW",
  menu: "VIEW MENU",
  apps: "GET THE APP",
  coupon: "CLAIM OFFER",
  wifi: "CONNECT TO WIFI",
};

/** The suggested CTA for a QR type — the user can always edit it. */
export function defaultFrameTextFor(type: QRType | null | undefined): string {
  return type ? TYPE_TEXT[type] : "SCAN ME";
}

/** Trim + clamp user CTA text to what a frame can render. */
export function normalizeFrameText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_FRAME_TEXT);
}

/* ── geometry helpers (all proportional to qrSize → resolution independent) ── */
const r = Math.round;
/** Rounded rect whose TOP corners are squared off (bottom bar). */
function bottomBar(x: number, y: number, w: number, h: number, rx: number, fill: string): FramePrimitive[] {
  return [
    { kind: "rect", x, y, w, h, rx, fill },
    { kind: "rect", x, y, w, h: Math.min(rx, h), fill },
  ];
}
/** Rounded rect whose BOTTOM corners are squared off (top bar). */
function topBar(x: number, y: number, w: number, h: number, rx: number, fill: string): FramePrimitive[] {
  return [
    { kind: "rect", x, y, w, h, rx, fill },
    { kind: "rect", x, y: y + h - Math.min(rx, h), w, h: Math.min(rx, h), fill },
  ];
}
function centeredText(cx: number, cy: number, text: string, size: number, fill: string): FramePrimitive {
  return { kind: "text", x: cx, y: cy, text, size, weight: 700, fill, anchor: "middle", tracking: size * 0.06 };
}

/* ═══════════════════════ The registry ═══════════════════════ */

export const qrFrames: QRFrame[] = [
  /* ── Simple ── */
  {
    id: "none",
    name: "None",
    category: "simple",
    hasText: false,
    defaultText: "",
    layout: ({ qrSize }) => ({
      width: qrSize,
      height: qrSize,
      qr: { x: 0, y: 0, size: qrSize },
      back: [],
      front: [],
    }),
  },
  {
    id: "border",
    name: "Simple Border",
    category: "simple",
    hasText: false,
    defaultText: "",
    layout: ({ qrSize, colors }) => {
      const p = r(qrSize * 0.07);
      const sw = Math.max(2, r(qrSize * 0.022));
      const W = qrSize + p * 2;
      return {
        width: W,
        height: W,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: W, fill: colors.background }],
        front: [
          { kind: "rect", x: sw / 2, y: sw / 2, w: W - sw, h: W - sw, stroke: colors.foreground, strokeWidth: sw },
        ],
      };
    },
  },
  {
    id: "rounded",
    name: "Rounded Border",
    category: "simple",
    hasText: false,
    defaultText: "",
    layout: ({ qrSize, colors }) => {
      const p = r(qrSize * 0.08);
      const sw = Math.max(2, r(qrSize * 0.022));
      const W = qrSize + p * 2;
      const rx = r(qrSize * 0.09);
      return {
        width: W,
        height: W,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: W, rx, fill: colors.background }],
        front: [
          { kind: "rect", x: sw / 2, y: sw / 2, w: W - sw, h: W - sw, rx, stroke: colors.foreground, strokeWidth: sw },
        ],
      };
    },
  },
  {
    id: "card",
    name: "Soft Card",
    category: "simple",
    hasText: false,
    defaultText: "",
    layout: ({ qrSize, colors }) => {
      const p = r(qrSize * 0.1);
      const W = qrSize + p * 2;
      const rx = r(qrSize * 0.11);
      const sw = Math.max(1, r(qrSize * 0.008));
      return {
        width: W,
        height: W,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: W, rx, fill: colors.background }],
        front: [
          {
            kind: "rect",
            x: sw / 2,
            y: sw / 2,
            w: W - sw,
            h: W - sw,
            rx,
            stroke: colors.foreground,
            strokeWidth: sw,
          },
        ],
      };
    },
  },

  /* ── CTA ── */
  {
    id: "scan-bottom",
    name: "Scan Me — Bottom",
    category: "cta",
    hasText: true,
    defaultText: "SCAN ME",
    layout: ({ qrSize, text, colors }) => {
      const p = r(qrSize * 0.08);
      const bar = r(qrSize * 0.2);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + bar;
      const rx = r(qrSize * 0.08);
      return {
        width: W,
        height: H,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, rx, fill: colors.background }],
        front: [
          ...bottomBar(0, H - bar, W, bar, rx, colors.foreground),
          centeredText(W / 2, H - bar / 2, text, r(bar * 0.42), colors.text),
        ],
      };
    },
  },
  {
    id: "scan-top",
    name: "Scan Me — Top",
    category: "cta",
    hasText: true,
    defaultText: "SCAN ME",
    layout: ({ qrSize, text, colors }) => {
      const p = r(qrSize * 0.08);
      const bar = r(qrSize * 0.2);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + bar;
      const rx = r(qrSize * 0.08);
      return {
        width: W,
        height: H,
        qr: { x: p, y: bar + p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, rx, fill: colors.background }],
        front: [
          ...topBar(0, 0, W, bar, rx, colors.foreground),
          centeredText(W / 2, bar / 2, text, r(bar * 0.42), colors.text),
        ],
      };
    },
  },
  {
    id: "caption",
    name: "Scan Here",
    category: "cta",
    hasText: true,
    defaultText: "SCAN HERE",
    layout: ({ qrSize, text, colors }) => {
      // Outlined card, CTA sits on the surface (no filled bar).
      const p = r(qrSize * 0.08);
      const bar = r(qrSize * 0.19);
      const sw = Math.max(2, r(qrSize * 0.02));
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + bar;
      const rx = r(qrSize * 0.07);
      return {
        width: W,
        height: H,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, rx, fill: colors.background }],
        front: [
          { kind: "rect", x: sw / 2, y: sw / 2, w: W - sw, h: H - sw, rx, stroke: colors.foreground, strokeWidth: sw },
          {
            kind: "line",
            x1: p,
            y1: H - bar,
            x2: W - p,
            y2: H - bar,
            stroke: colors.foreground,
            strokeWidth: Math.max(1, r(sw * 0.5)),
          },
          centeredText(W / 2, H - bar / 2, text, r(bar * 0.4), colors.foreground),
        ],
      };
    },
  },
  {
    id: "pill",
    name: "Point Camera Here",
    category: "cta",
    hasText: true,
    defaultText: "POINT CAMERA HERE",
    layout: ({ qrSize, text, colors }) => {
      const p = r(qrSize * 0.07);
      const gap = r(qrSize * 0.05);
      const pill = r(qrSize * 0.17);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + gap + pill;
      const pillW = r(W * 0.82);
      return {
        width: W,
        height: H,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, fill: colors.background }],
        front: [
          {
            kind: "rect",
            x: (W - pillW) / 2,
            y: H - p - pill,
            w: pillW,
            h: pill,
            rx: pill / 2,
            fill: colors.foreground,
          },
          centeredText(W / 2, H - p - pill / 2, text, r(pill * 0.38), colors.text),
        ],
      };
    },
  },

  /* ── Business ── */
  {
    id: "header",
    name: "Header Strip",
    category: "business",
    hasText: true,
    defaultText: "VIEW MENU",
    layout: ({ qrSize, text, colors }) => {
      const p = r(qrSize * 0.09);
      const bar = r(qrSize * 0.22);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + bar;
      return {
        width: W,
        height: H,
        qr: { x: p, y: bar + p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, fill: colors.background }],
        front: [
          { kind: "rect", x: 0, y: 0, w: W, h: bar, fill: colors.foreground },
          centeredText(W / 2, bar / 2, text, r(bar * 0.38), colors.text),
        ],
      };
    },
  },
  {
    id: "label",
    name: "Website Label",
    category: "business",
    hasText: true,
    defaultText: "VISIT WEBSITE",
    layout: ({ qrSize, text, colors }) => {
      // Card + a thin accent rule above a quiet caption.
      const p = r(qrSize * 0.09);
      const bar = r(qrSize * 0.17);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + bar;
      const rx = r(qrSize * 0.06);
      const rule = Math.max(2, r(qrSize * 0.018));
      const ruleW = r(qrSize * 0.22);
      return {
        width: W,
        height: H,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, rx, fill: colors.background }],
        front: [
          {
            kind: "rect",
            x: (W - ruleW) / 2,
            y: H - bar + r(bar * 0.16),
            w: ruleW,
            h: rule,
            rx: rule / 2,
            fill: colors.foreground,
          },
          centeredText(W / 2, H - bar * 0.42, text, r(bar * 0.38), colors.foreground),
        ],
      };
    },
  },
  {
    id: "brackets",
    name: "Corner Brackets",
    category: "business",
    hasText: true,
    defaultText: "SAVE CONTACT",
    layout: ({ qrSize, text, colors }) => {
      const p = r(qrSize * 0.1);
      const bar = r(qrSize * 0.17);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + bar;
      const sw = Math.max(2, r(qrSize * 0.024));
      const len = r(qrSize * 0.16);
      const o = r(sw / 2);
      const bracket = (x: number, y: number, dx: number, dy: number): FramePrimitive[] => [
        { kind: "line", x1: x, y1: y, x2: x + dx * len, y2: y, stroke: colors.foreground, strokeWidth: sw },
        { kind: "line", x1: x, y1: y, x2: x, y2: y + dy * len, stroke: colors.foreground, strokeWidth: sw },
      ];
      const boxB = qrSize + p * 2;
      return {
        width: W,
        height: H,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, fill: colors.background }],
        front: [
          ...bracket(o, o, 1, 1),
          ...bracket(W - o, o, -1, 1),
          ...bracket(o, boxB - o, 1, -1),
          ...bracket(W - o, boxB - o, -1, -1),
          centeredText(W / 2, H - bar * 0.45, text, r(bar * 0.4), colors.foreground),
        ],
      };
    },
  },
  {
    id: "follow",
    name: "Follow Us",
    category: "business",
    hasText: true,
    defaultText: "FOLLOW US",
    layout: ({ qrSize, text, colors }) => {
      // Filled surface with a wide CTA block under the QR.
      const p = r(qrSize * 0.08);
      const bar = r(qrSize * 0.24);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + bar;
      const rx = r(qrSize * 0.1);
      const inner = r(qrSize * 0.05);
      return {
        width: W,
        height: H,
        qr: { x: p, y: p, size: qrSize },
        // The inner panel sits BEHIND the QR — anything in `front` would
        // paint over the code.
        back: [
          { kind: "rect", x: 0, y: 0, w: W, h: H, rx, fill: colors.foreground },
          {
            kind: "rect",
            x: p - inner,
            y: p - inner,
            w: qrSize + inner * 2,
            h: qrSize + inner * 2,
            rx: r(rx * 0.6),
            fill: colors.background,
          },
        ],
        front: [centeredText(W / 2, H - bar / 2 - r(p * 0.2), text, r(bar * 0.34), colors.text)],
      };
    },
  },

  /* ── Creative ── */
  {
    id: "badge",
    name: "Badge",
    category: "creative",
    hasText: true,
    defaultText: "SCAN ME",
    layout: ({ qrSize, text, colors }) => {
      // A pill badge overlapping the top edge of the card.
      const p = r(qrSize * 0.1);
      const badge = r(qrSize * 0.16);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + r(badge * 0.6);
      const top = r(badge * 0.6);
      const rx = r(qrSize * 0.08);
      const badgeW = r(W * 0.6);
      const sw = Math.max(1, r(qrSize * 0.01));
      return {
        width: W,
        height: H,
        qr: { x: p, y: top + p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: top, w: W, h: H - top, rx, fill: colors.background }],
        front: [
          { kind: "rect", x: sw / 2, y: top + sw / 2, w: W - sw, h: H - top - sw, rx, stroke: colors.foreground, strokeWidth: sw },
          { kind: "rect", x: (W - badgeW) / 2, y: 0, w: badgeW, h: badge, rx: badge / 2, fill: colors.foreground },
          centeredText(W / 2, badge / 2, text, r(badge * 0.42), colors.text),
        ],
      };
    },
  },
  {
    id: "ticket",
    name: "Ticket",
    category: "creative",
    hasText: true,
    defaultText: "CLAIM OFFER",
    layout: ({ qrSize, text, colors }) => {
      const p = r(qrSize * 0.09);
      const bar = r(qrSize * 0.2);
      const W = qrSize + p * 2;
      const H = qrSize + p * 2 + bar;
      const rx = r(qrSize * 0.06);
      const notch = r(qrSize * 0.055);
      const yCut = H - bar;
      const dash = Math.max(1, r(qrSize * 0.012));
      return {
        width: W,
        height: H,
        qr: { x: p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, rx, fill: colors.background }],
        front: [
          { kind: "line", x1: p * 0.7, y1: yCut, x2: W - p * 0.7, y2: yCut, stroke: colors.foreground, strokeWidth: dash },
          // side notches punched out of the card
          { kind: "circle", cx: 0, cy: yCut, r: notch, fill: colors.foreground },
          { kind: "circle", cx: W, cy: yCut, r: notch, fill: colors.foreground },
          centeredText(W / 2, H - bar / 2 + r(bar * 0.05), text, r(bar * 0.4), colors.foreground),
        ],
      };
    },
  },
  {
    id: "poster",
    name: "Minimal Poster",
    category: "creative",
    hasText: true,
    defaultText: "SCAN TO VIEW",
    layout: ({ qrSize, text, colors }) => {
      // Title above, generous whitespace, thin rule under the QR.
      const p = r(qrSize * 0.12);
      const head = r(qrSize * 0.18);
      const foot = r(qrSize * 0.1);
      const W = qrSize + p * 2;
      const H = head + qrSize + p + foot;
      const rule = Math.max(1, r(qrSize * 0.01));
      const ruleW = r(qrSize * 0.3);
      return {
        width: W,
        height: H,
        qr: { x: p, y: head, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, fill: colors.background }],
        front: [
          centeredText(W / 2, head / 2, text, r(head * 0.36), colors.foreground),
          {
            kind: "rect",
            x: (W - ruleW) / 2,
            y: head + qrSize + r(foot * 0.35),
            w: ruleW,
            h: rule,
            rx: rule / 2,
            fill: colors.foreground,
          },
        ],
      };
    },
  },
  {
    id: "strip",
    name: "Split Strip",
    category: "creative",
    hasText: true,
    defaultText: "GET THE APP",
    layout: ({ qrSize, text, colors }) => {
      // Accent strip down the left, CTA under the QR.
      const p = r(qrSize * 0.09);
      const strip = r(qrSize * 0.07);
      const bar = r(qrSize * 0.18);
      const W = qrSize + p * 2 + strip;
      const H = qrSize + p * 2 + bar;
      return {
        width: W,
        height: H,
        qr: { x: strip + p, y: p, size: qrSize },
        back: [{ kind: "rect", x: 0, y: 0, w: W, h: H, fill: colors.background }],
        front: [
          { kind: "rect", x: 0, y: 0, w: strip, h: H, fill: colors.foreground },
          {
            kind: "text",
            x: strip + p,
            y: H - bar / 2,
            text,
            size: r(bar * 0.4),
            weight: 700,
            fill: colors.foreground,
            anchor: "start",
            tracking: r(bar * 0.4) * 0.06,
          },
        ],
      };
    },
  },
];

const byId = new Map(qrFrames.map((f) => [f.id, f]));

export function getFrame(id: string | null | undefined): QRFrame {
  return (id && byId.get(id)) || byId.get("none")!;
}

export function isFrameId(id: string | null | undefined): boolean {
  return Boolean(id && byId.has(id));
}

export const FRAME_CATEGORIES: ReadonlyArray<{ id: QRFrameCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "simple", label: "Simple" },
  { id: "cta", label: "Scan CTA" },
  { id: "business", label: "Business" },
  { id: "creative", label: "Creative" },
];

/** The text a frame will actually draw. */
export function resolveFrameText(frame: QRFrame, custom: string, type?: QRType | null): string {
  if (!frame.hasText) return "";
  const typed = normalizeFrameText(custom);
  if (typed) return typed;
  return normalizeFrameText(type ? defaultFrameTextFor(type) : frame.defaultText);
}
