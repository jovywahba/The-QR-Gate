import { Resend } from "resend";
import { site } from "@/lib/site";

/**
 * Shared Resend account, per-app API key (see CLAUDE.md §6). Resend is
 * OPTIONAL: the client is created LAZILY (never at module scope) so a
 * build/deploy with no RESEND_API_KEY can't fail while collecting page
 * data — mirrors the lazy Stripe client.
 */
let client: Resend | null = null;

/** Call only after confirming a real key is configured. */
export function getResend(): Resend {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

// Sending identity — the app's OWN domain (deliverability + branding).
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? `${site.name} <hello@${site.domain}>`;

// Where replies land. For now ALL tools route support to one shared inbox
// (site.email = info@tryhalfstack.com). Pass `replyTo: REPLY_TO` on every send.
export const REPLY_TO = site.email;
