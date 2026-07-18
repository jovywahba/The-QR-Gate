import { EMAIL_FROM, REPLY_TO, resend } from "./resend";
import { site } from "./site";

/**
 * ───────────────────────────────────────────────────────────────
 * Transactional emails (Resend). Every send is guarded: with no real
 * RESEND_API_KEY these are silent no-ops, and any send failure is
 * logged, never thrown — email must never block auth, publishing, or
 * billing. Bodies are plain, on-brand, and factual.
 * ───────────────────────────────────────────────────────────────
 */

function resendReady(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key) && !key!.includes("placeholder");
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resendReady() || !to) return;
  try {
    await resend.emails.send({ from: EMAIL_FROM, to, subject, html, replyTo: REPLY_TO });
  } catch (err) {
    console.error("email send failed:", err instanceof Error ? err.message : err);
  }
}

function shell(heading: string, body: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#1B1B2F">
      <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid #E6E3DB;margin:24px 0" />
      <p style="font-size:12px;color:#6B675C">${site.name} · <a href="${site.url}" style="color:#3B5BFF">${site.url.replace(/^https?:\/\//, "")}</a></p>
    </div>`;
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  await send(
    to,
    `Welcome to ${site.name}`,
    shell(
      `Welcome to ${site.name}`,
      `<p>Your account is ready. Create up to <strong>3 free QR codes</strong> — websites, WiFi, contact cards, PDFs, and more — then style and download them.</p>
       <p><a href="${site.url}" style="color:#3B5BFF">Create your first QR code →</a></p>`,
    ),
  );
}

export async function sendSubscriptionActivatedEmail(to: string): Promise<void> {
  await send(
    to,
    `${site.pricing.planName} is active`,
    shell(
      `You're on ${site.pricing.planName}`,
      `<p>Your subscription is active. You now have <strong>unlimited QR codes</strong> and full scan analytics.</p>
       <p><a href="${site.url}/dashboard" style="color:#3B5BFF">Open your dashboard →</a></p>`,
    ),
  );
}

export async function sendPaymentFailedEmail(to: string): Promise<void> {
  await send(
    to,
    `Payment failed — action needed`,
    shell(
      `We couldn't process your payment`,
      `<p>Your most recent ${site.pricing.planName} payment didn't go through. Your existing QR codes keep working — please update your payment method to avoid interruption.</p>
       <p><a href="${site.url}/dashboard/billing" style="color:#3B5BFF">Manage billing →</a></p>`,
    ),
  );
}

export async function sendSubscriptionCanceledEmail(to: string): Promise<void> {
  await send(
    to,
    `Your ${site.pricing.planName} subscription was canceled`,
    shell(
      `Subscription canceled`,
      `<p>Your ${site.pricing.planName} subscription has ended. Your existing QR codes and their public pages keep working — you just can't create new ones beyond the free limit until you resubscribe.</p>
       <p><a href="${site.url}/dashboard/billing" style="color:#3B5BFF">Reactivate →</a></p>`,
    ),
  );
}
