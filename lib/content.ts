/**
 * Lightweight, dependency-free content for blog + docs so the template
 * compiles out of the box. For a real content hub, swap this for MDX
 * (@next/mdx or next-mdx-remote) reading from /content — the page routes
 * already expect { slug, title, description, date?, body[] }.
 */

export type Doc = {
  slug: string;
  title: string;
  description: string;
  /** simple paragraphs; replace with MDX when you outgrow this */
  body: string[];
};

export type Post = Doc & { date: string };

export const posts: Post[] = [
  {
    slug: "hello",
    title: "Why we built this",
    description: "The same software the incumbents sell, at half the price.",
    date: "2026-01-01",
    body: [
      "Most teams pay enterprise prices for a fraction of the features they use.",
      "We rebuilt the part that matters and priced it honestly. No gimmicks.",
    ],
  },
];

export const docs: Doc[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    description: "Create an account and ship your first thing in five minutes.",
    body: ["Sign up, confirm your email, and you're in.", "Need help? Email us anytime."],
  },
  {
    slug: "billing",
    title: "Billing & plans",
    description: "How the free trial and subscription work.",
    body: [
      "Start with a free trial — card required, cancel anytime before it ends.",
      "Manage your plan from Settings → Billing, powered by Stripe.",
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
export const getDoc = (slug: string) => docs.find((d) => d.slug === slug);
