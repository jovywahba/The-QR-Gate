/**
 * Lightweight, dependency-free content for blog + docs. The page routes
 * expect { slug, title, description, date?, body[] }. Keep it honest and
 * accurate to how the product actually works — no filler.
 */

export type Doc = {
  slug: string;
  title: string;
  description: string;
  body: string[];
};

export type Post = Doc & { date: string };

export const posts: Post[] = [
  {
    slug: "hello",
    title: "Why we built The QR Gate",
    description: "A simple, honest QR code generator — built to actually scan.",
    date: "2026-01-01",
    body: [
      "Most QR generators either water down the free tier with watermarks and expiring codes, or hide the useful parts behind a maze of add-ons. We wanted the opposite: a clean builder for every common QR type, real design controls that don't break scannability, and honest pricing.",
      "The QR Gate gives you 16 QR types, full customization (colors, gradients, logos, frames), and PNG/SVG downloads with no watermark. Publish a code and it becomes a hosted, editable page with privacy-safe scan analytics — no per-scan fees.",
      "Start free with 3 codes, no card required. Go unlimited on Pro for $10/month whenever you're ready.",
    ],
  },
];

export const docs: Doc[] = [
  {
    slug: "getting-started",
    title: "Create your first QR code",
    description: "From the homepage to a downloaded code in four steps.",
    body: [
      "The homepage is the builder. Step 1 — pick a QR type (Website, WiFi, vCard, PDF, menu and more). Step 2 — add your content; the live mobile preview and QR preview update as you type.",
      "Step 3 — design the code: colors, gradients, dot and corner styles, a center logo, and framed calls-to-action. The QR Health check warns you before a design gets too low-contrast to scan.",
      "Step 4 — download. Export PNG at 512, 1024 or 2048 px, or a true vector SVG. Direct types (like a plain URL or WiFi) encode the value itself; hosted types publish a page first (see “Direct vs hosted vs tracked”).",
      "Sign in to save a code to your account, publish a hosted page, and track scans.",
    ],
  },
  {
    slug: "direct-hosted-tracked",
    title: "Direct vs hosted vs tracked QR codes",
    description: "How the three QR modes differ, and when to use each.",
    body: [
      "Direct / native codes encode the value itself — a URL, WiFi credentials, a vCard, a WhatsApp link. They work offline and never expire, but there's nothing to edit or track after you print them.",
      "Hosted codes (PDF, list of links, business page, gallery, coupon and more) point at a page we host at theqrgate.com/q/… . You can edit the destination anytime without reprinting, and you get scan analytics.",
      "Tracked codes wrap a direct URL in a short redirect at theqrgate.com/r/… so scans are counted before forwarding on. Turn tracking on for any URL-type code in Step 2.",
      "Scan analytics are privacy-safe: coarse device/location only, no raw IP, and your own visits are excluded.",
    ],
  },
  {
    slug: "design",
    title: "Designing a scannable code",
    description: "Customize the look without breaking the scan.",
    body: [
      "In Step 3 you can change the foreground and background colors, apply a linear or radial gradient, choose dot and corner styles, add a center logo, and wrap the code in a frame with a call-to-action.",
      "Every change runs a readability check. Low contrast, an oversized logo, or too little quiet zone are flagged — errors block download until fixed, warnings just advise.",
      "Twenty ready-made templates give you a good starting point. “Reset design” returns to the clean default at any time.",
    ],
  },
  {
    slug: "analytics",
    title: "Scan analytics",
    description: "What we track for hosted and tracked codes — and what we don't.",
    body: [
      "Published hosted codes and tracked redirects record each scan: the day, a coarse device type, browser, operating system, and country/region.",
      "We never store raw IP addresses or visitor identity. A one-way daily hash approximates unique visitors, bot traffic is separated out, and the owner's own scans are excluded.",
      "See it all on a code's Analytics page in your dashboard — scans over time, unique visitors, and breakdowns you can export to CSV.",
    ],
  },
  {
    slug: "billing",
    title: "Plans & billing",
    description: "How the free plan and Pro subscription work.",
    body: [
      "Free accounts keep up to 3 active QR codes at a time — no credit card required. Pausing or archiving a code frees a slot.",
      "Pro is $10/month for unlimited active codes plus scan analytics. There's no free trial and no per-scan fees; you're charged the flat monthly price and can cancel anytime.",
      "Upgrade or manage your subscription from Dashboard → Billing, powered by Stripe. Have a promo code? Enter it on the Stripe checkout page.",
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
export const getDoc = (slug: string) => docs.find((d) => d.slug === slug);
