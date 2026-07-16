/* -------------------------------------------------------------------------- *
 * DEMO DATA — sample CRM content so the product shell looks real out of the box.
 * This whole `_demo/` folder is throwaway: delete it (and swap the pages that
 * import it) when building the actual product. Underscore = not a route.
 * -------------------------------------------------------------------------- */

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type ContactStatus = "lead" | "qualified" | "customer" | "churned";
export type Health = "good" | "watch" | "at_risk";
export type ActivityKind = "call" | "email" | "meeting" | "note" | "task";
export type Priority = "high" | "medium" | "low";

/** A small, restrained status palette (design-system status colors). */
export const STAGE_META: Record<DealStage, { label: string; dot: string }> = {
  lead: { label: "Lead", dot: "#9A968A" },
  qualified: { label: "Qualified", dot: "#3B5BFF" },
  proposal: { label: "Proposal", dot: "#D9A21B" },
  negotiation: { label: "Negotiation", dot: "#6E86FF" },
  won: { label: "Won", dot: "#1B8A5B" },
  lost: { label: "Lost", dot: "#C2392F" },
};

export const CONTACT_STATUS_META: Record<ContactStatus, { label: string; dot: string }> = {
  lead: { label: "Lead", dot: "#9A968A" },
  qualified: { label: "Qualified", dot: "#D9A21B" },
  customer: { label: "Customer", dot: "#1B8A5B" },
  churned: { label: "Churned", dot: "#C2392F" },
};

export const HEALTH_META: Record<Health, { label: string; dot: string }> = {
  good: { label: "Healthy", dot: "#1B8A5B" },
  watch: { label: "Watch", dot: "#D9A21B" },
  at_risk: { label: "At risk", dot: "#C2392F" },
};

export type Contact = {
  id: string;
  name: string;
  initials: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  status: ContactStatus;
  owner: string;
  tags: string[];
  lastActivity: string;
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  location: string;
  openDeals: number;
  arr: number;
  health: Health;
  owner: string;
};

export type Deal = {
  id: string;
  name: string;
  company: string;
  contact: string;
  value: number;
  stage: DealStage;
  owner: string;
  ownerInitials: string;
  closeDate: string;
  probability: number;
};

export type Activity = {
  id: string;
  kind: ActivityKind;
  title: string;
  meta: string;
  who: string;
  whoInitials: string;
  time: string;
};

export type Task = {
  id: string;
  title: string;
  due: string;
  priority: Priority;
  done: boolean;
  relatedTo: string;
};

export const CONTACTS: Contact[] = [
  { id: "ct_01", name: "Mara Lin", initials: "ML", title: "VP Engineering", company: "Northwind", email: "mara@northwind.io", phone: "+1 415 555 0142", status: "customer", owner: "You", tags: ["champion", "enterprise"], lastActivity: "2h ago" },
  { id: "ct_02", name: "Tom Reyes", initials: "TR", title: "Head of Ops", company: "Atlas Freight", email: "tom@atlasfreight.com", phone: "+1 312 555 0198", status: "qualified", owner: "You", tags: ["evaluator"], lastActivity: "yesterday" },
  { id: "ct_03", name: "Priya Shah", initials: "PS", title: "CTO", company: "Bloom Health", email: "priya@bloomhealth.co", phone: "+1 206 555 0173", status: "qualified", owner: "Dana K.", tags: ["technical"], lastActivity: "3d ago" },
  { id: "ct_04", name: "Dan Cohen", initials: "DC", title: "Founder", company: "Pixel & Co", email: "dan@pixelco.studio", phone: "+1 646 555 0110", status: "lead", owner: "You", tags: ["inbound"], lastActivity: "5d ago" },
  { id: "ct_05", name: "Sara Bell", initials: "SB", title: "Procurement", company: "Vertex Mfg", email: "sara@vertexmfg.com", phone: "+1 713 555 0155", status: "customer", owner: "Marco T.", tags: ["renewal"], lastActivity: "1w ago" },
  { id: "ct_06", name: "Alex Kim", initials: "AK", title: "Marketing Lead", company: "Lumen Media", email: "alex@lumen.media", phone: "+1 213 555 0164", status: "lead", owner: "Dana K.", tags: ["inbound", "smb"], lastActivity: "1w ago" },
  { id: "ct_07", name: "Nadia Rao", initials: "NR", title: "COO", company: "Harbor Logistics", email: "nadia@harborlog.com", phone: "+1 305 555 0189", status: "qualified", owner: "You", tags: ["enterprise"], lastActivity: "2w ago" },
  { id: "ct_08", name: "Leo Park", initials: "LP", title: "IT Director", company: "Quanta Labs", email: "leo@quanta.dev", phone: "+1 408 555 0127", status: "churned", owner: "Marco T.", tags: ["winback"], lastActivity: "1mo ago" },
  { id: "ct_09", name: "Iris Moreau", initials: "IM", title: "CFO", company: "Cedar Bank", email: "iris@cedar.bank", phone: "+1 617 555 0133", status: "customer", owner: "You", tags: ["finance"], lastActivity: "2d ago" },
  { id: "ct_10", name: "Owen Reid", initials: "OR", title: "Product Manager", company: "Slate Software", email: "owen@slate.software", phone: "+1 503 555 0148", status: "lead", owner: "Dana K.", tags: ["inbound"], lastActivity: "4d ago" },
];

export const COMPANIES: Company[] = [
  { id: "co_01", name: "Northwind", domain: "northwind.io", industry: "SaaS", size: "501–1k", location: "San Francisco, US", openDeals: 2, arr: 84000, health: "good", owner: "You" },
  { id: "co_02", name: "Atlas Freight", domain: "atlasfreight.com", industry: "Logistics", size: "1k–5k", location: "Chicago, US", openDeals: 1, arr: 42000, health: "watch", owner: "You" },
  { id: "co_03", name: "Bloom Health", domain: "bloomhealth.co", industry: "Healthcare", size: "201–500", location: "Seattle, US", openDeals: 1, arr: 0, health: "good", owner: "Dana K." },
  { id: "co_04", name: "Vertex Mfg", domain: "vertexmfg.com", industry: "Manufacturing", size: "1k–5k", location: "Houston, US", openDeals: 0, arr: 120000, health: "good", owner: "Marco T." },
  { id: "co_05", name: "Lumen Media", domain: "lumen.media", industry: "Media", size: "51–200", location: "Los Angeles, US", openDeals: 1, arr: 0, health: "watch", owner: "Dana K." },
  { id: "co_06", name: "Quanta Labs", domain: "quanta.dev", industry: "Research", size: "51–200", location: "San Jose, US", openDeals: 0, arr: 0, health: "at_risk", owner: "Marco T." },
  { id: "co_07", name: "Cedar Bank", domain: "cedar.bank", industry: "Finance", size: "5k+", location: "Boston, US", openDeals: 2, arr: 210000, health: "good", owner: "You" },
];

export const DEALS: Deal[] = [
  { id: "dl_01", name: "Northwind — Platform expansion", company: "Northwind", contact: "Mara Lin", value: 48000, stage: "negotiation", owner: "You", ownerInitials: "YO", closeDate: "Jun 24", probability: 80 },
  { id: "dl_02", name: "Cedar Bank — Enterprise rollout", company: "Cedar Bank", contact: "Iris Moreau", value: 96000, stage: "proposal", owner: "You", ownerInitials: "YO", closeDate: "Jul 02", probability: 60 },
  { id: "dl_03", name: "Atlas Freight — Ops module", company: "Atlas Freight", contact: "Tom Reyes", value: 24000, stage: "qualified", owner: "You", ownerInitials: "YO", closeDate: "Jul 11", probability: 40 },
  { id: "dl_04", name: "Bloom Health — Pilot", company: "Bloom Health", contact: "Priya Shah", value: 18000, stage: "qualified", owner: "Dana K.", ownerInitials: "DK", closeDate: "Jul 15", probability: 35 },
  { id: "dl_05", name: "Pixel & Co — Starter", company: "Pixel & Co", contact: "Dan Cohen", value: 6000, stage: "lead", owner: "You", ownerInitials: "YO", closeDate: "Jul 28", probability: 15 },
  { id: "dl_06", name: "Lumen Media — Team plan", company: "Lumen Media", contact: "Alex Kim", value: 9600, stage: "lead", owner: "Dana K.", ownerInitials: "DK", closeDate: "Aug 04", probability: 15 },
  { id: "dl_07", name: "Harbor Logistics — Fleet", company: "Harbor Logistics", contact: "Nadia Rao", value: 54000, stage: "proposal", owner: "You", ownerInitials: "YO", closeDate: "Jul 09", probability: 55 },
  { id: "dl_08", name: "Cedar Bank — Add-on seats", company: "Cedar Bank", contact: "Iris Moreau", value: 21000, stage: "negotiation", owner: "You", ownerInitials: "YO", closeDate: "Jun 27", probability: 75 },
  { id: "dl_09", name: "Vertex Mfg — Renewal", company: "Vertex Mfg", contact: "Sara Bell", value: 120000, stage: "won", owner: "Marco T.", ownerInitials: "MT", closeDate: "Jun 10", probability: 100 },
  { id: "dl_10", name: "Quanta Labs — Trial", company: "Quanta Labs", contact: "Leo Park", value: 12000, stage: "lost", owner: "Marco T.", ownerInitials: "MT", closeDate: "Jun 05", probability: 0 },
];

export const ACTIVITIES: Activity[] = [
  { id: "ac_01", kind: "call", title: "Discovery call with Mara Lin", meta: "Northwind · 32 min", who: "Mara Lin", whoInitials: "ML", time: "Today, 2:30 PM" },
  { id: "ac_02", kind: "email", title: "Sent proposal to Cedar Bank", meta: "Enterprise rollout · $96,000", who: "Iris Moreau", whoInitials: "IM", time: "Today, 11:05 AM" },
  { id: "ac_03", kind: "meeting", title: "Demo — Atlas Freight ops team", meta: "5 attendees", who: "Tom Reyes", whoInitials: "TR", time: "Yesterday, 4:00 PM" },
  { id: "ac_04", kind: "note", title: "Logged note on Bloom Health", meta: "Security review needed before pilot", who: "Priya Shah", whoInitials: "PS", time: "Yesterday, 9:20 AM" },
  { id: "ac_05", kind: "task", title: "Follow up with Pixel & Co", meta: "Completed", who: "Dan Cohen", whoInitials: "DC", time: "2 days ago" },
  { id: "ac_06", kind: "call", title: "Renewal check-in — Vertex Mfg", meta: "Vertex Mfg · 18 min", who: "Sara Bell", whoInitials: "SB", time: "3 days ago" },
  { id: "ac_07", kind: "email", title: "Intro email to Harbor Logistics", meta: "Fleet opportunity", who: "Nadia Rao", whoInitials: "NR", time: "4 days ago" },
  { id: "ac_08", kind: "meeting", title: "QBR — Cedar Bank", meta: "Quarterly business review", who: "Iris Moreau", whoInitials: "IM", time: "1 week ago" },
];

export const TASKS: Task[] = [
  { id: "tk_01", title: "Send pricing to Cedar Bank", due: "Today", priority: "high", done: false, relatedTo: "Cedar Bank" },
  { id: "tk_02", title: "Prep negotiation deck — Northwind", due: "Today", priority: "high", done: false, relatedTo: "Northwind" },
  { id: "tk_03", title: "Follow up with Atlas Freight", due: "Tomorrow", priority: "medium", done: false, relatedTo: "Atlas Freight" },
  { id: "tk_04", title: "Schedule Bloom Health security review", due: "Thu", priority: "medium", done: false, relatedTo: "Bloom Health" },
  { id: "tk_05", title: "Log call notes — Vertex renewal", due: "Fri", priority: "low", done: true, relatedTo: "Vertex Mfg" },
  { id: "tk_06", title: "Re-engage Quanta Labs (win-back)", due: "Next week", priority: "low", done: false, relatedTo: "Quanta Labs" },
];

/** 8-month series for the overview chart, per metric. */
export const SERIES: Record<"revenue" | "deals" | "leads", { label: string; points: number[] }> = {
  revenue: { label: "Revenue", points: [42, 38, 51, 47, 63, 58, 72, 84] },
  deals: { label: "Deals won", points: [4, 3, 5, 4, 6, 5, 7, 8] },
  leads: { label: "New leads", points: [18, 22, 19, 28, 24, 31, 27, 35] },
};
export const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export const STAGE_ORDER: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

export function money(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n.toLocaleString()}`;
}
