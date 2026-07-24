import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

/**
 * Privacy Policy for The QR Gate. Written to reflect what the app actually
 * does (scan analytics use a one-way visitor hash — no raw IP is stored for
 * scans; WiFi passwords are never persisted). This is not legal advice —
 * confirm the legal entity + address and have counsel review before launch.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 24, 2026">
      <LegalSection heading="Review note">
        <p>
          This policy describes how the Service works today and is provided for transparency. It is
          not legal advice; the operating legal entity and postal address should be confirmed and this
          document reviewed by counsel before it is relied upon.
        </p>
      </LegalSection>

      <LegalSection heading="1. Who we are">
        <p>
          {site.name} (“we,” “us”) is a QR-code generator that lets you create, host, and track QR
          codes at {site.domain}. This policy explains what we collect, why, and your choices. Contact
          us at <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </LegalSection>

      <LegalSection heading="2. Account data">
        <ul>
          <li>Your email and a password, which is hashed by our authentication provider (Supabase) — we never see or store your plaintext password.</li>
          <li>If you sign in with Google, your name and avatar as provided by Google.</li>
          <li>Your display name, if you set one in Settings.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. QR content you create">
        <p>
          The destinations, text, links, business details, contact cards, and files you put into your
          QR codes are “Customer Data.” For <strong>hosted</strong> QR codes, that content is served
          publicly at a hard-to-guess URL ({site.domain}/q/…) so anyone who scans the code can see it —
          treat hosted content as public. Draft and unpublished content is private to your account
          (enforced by row-level security). You control and are responsible for this content.
        </p>
        <p>
          <strong>WiFi passwords</strong> entered for a WiFi QR are never written to our database or
          logs — they exist only in memory in your browser while you build the code, and are removed
          from any saved draft.
        </p>
      </LegalSection>

      <LegalSection heading="4. Uploaded files">
        <p>
          Files you upload (PDFs, images, audio, video, logos) are stored in Supabase Storage. Drafts
          live in a private bucket accessible only to your account; when you publish a hosted QR, the
          relevant files are copied to a public bucket so the hosted page can display them.
        </p>
      </LegalSection>

      <LegalSection heading="5. Scan analytics (privacy-preserving)">
        <p>
          When someone opens a <strong>tracked</strong> QR ({site.domain}/q/… or a tracked redirect
          {" "}{site.domain}/r/…), we record a scan event with coarse, non-identifying signals:
        </p>
        <ul>
          <li>approximate country / region / city (from network-edge geolocation headers);</li>
          <li>device type, browser, and operating system (derived from the user-agent);</li>
          <li>the referring website’s host, if any; and</li>
          <li>a one-way <strong>visitor hash</strong> for approximate unique counts.</li>
        </ul>
        <p>
          We do <strong>not</strong> store raw IP addresses for scans. The visitor hash is a salted,
          one-way hash of (IP + user-agent + day) that is used only to estimate unique visitors within
          a day and cannot be reversed back to an IP. We exclude bots, link-preview crawlers, page
          prefetches, and a QR owner’s own previews from human counts. Native QR types (WiFi, direct
          contact cards) are not tracked at all because scanning them never contacts our servers.
        </p>
        <p>
          Signed-in users also generate a lightweight “last seen” presence record (an opaque per-tab
          identifier and a coarse area such as “Dashboard”), used to show an approximate “online now”
          count to administrators. It contains no IP address and no session token.
        </p>
      </LegalSection>

      <LegalSection heading="6. Billing data">
        <p>
          Subscriptions are processed by Stripe. Stripe collects and stores your card details; we do
          not. We store your subscription status and Stripe customer/subscription identifiers so we can
          provide the plan you pay for. Free accounts require no payment information.
        </p>
      </LegalSection>

      <LegalSection heading="7. Cookies & product analytics">
        <p>
          We use essential cookies to keep you signed in and operate the Service, and privacy-friendly
          product analytics (Vercel Analytics / Speed Insights) to understand aggregate usage and
          performance. We do not use advertising cookies.
        </p>
      </LegalSection>

      <LegalSection heading="8. How we use information">
        <ul>
          <li>Provide, secure, and operate the Service and your QR codes;</li>
          <li>Show you analytics for your own QR codes;</li>
          <li>Process payments and manage subscriptions;</li>
          <li>Respond to support and send service-related notices;</li>
          <li>Detect and prevent abuse, and comply with law.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="9. Service providers">
        <p>We don’t sell your personal data. We share it only with providers that help run the Service:</p>
        <ul>
          <li><strong>Supabase</strong> — database, authentication, and file storage;</li>
          <li><strong>Stripe</strong> — payment processing;</li>
          <li><strong>Resend</strong> — transactional email (when configured);</li>
          <li><strong>Vercel</strong> — hosting, edge geolocation, and analytics.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="10. Retention & deletion">
        <p>
          We keep account and QR data while your account is active. You can archive or delete individual
          QR codes at any time. To delete your account and associated data, contact{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>; we will remove or anonymize your personal
          data within a reasonable period except where we must retain records for legal, tax, or
          security reasons. Aggregate, de-identified analytics may be retained.
        </p>
      </LegalSection>

      <LegalSection heading="11. Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct, export, or delete your
          personal data, and to object to or restrict certain processing. Manage much of your data in
          your account settings, or contact <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </LegalSection>

      <LegalSection heading="12. Children">
        <p>The Service isn’t directed to children under 16, and we don’t knowingly collect their data.</p>
      </LegalSection>

      <LegalSection heading="13. Changes">
        <p>
          We may update this policy; material changes will be notified in-app or by email, and the “last
          updated” date above will change.
        </p>
      </LegalSection>

      <LegalSection heading="14. Contact">
        <p>
          Questions or requests: <a href={`mailto:${site.email}`}>{site.email}</a>. {site.name} is a
          Halfstack product.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
