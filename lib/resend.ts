import { Resend } from "resend";
import { site } from "@/lib/site";

/** Shared Resend account, per-app API key (see CLAUDE.md §6). */
export const resend = new Resend(process.env.RESEND_API_KEY);

// Sending identity — the app's OWN domain (deliverability + branding).
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? `${site.name} <hello@${site.domain}>`;

// Where replies land. For now ALL tools route support to one shared inbox
// (site.email = info@tryhalfstack.com). Pass `replyTo: REPLY_TO` on every send.
export const REPLY_TO = site.email;
