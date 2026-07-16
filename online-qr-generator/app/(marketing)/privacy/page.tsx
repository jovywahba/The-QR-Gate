import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

// Template Privacy Policy. Customize the [bracketed] placeholders per product,
// confirm the subprocessor list matches this app, and have counsel review.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 18, 2026">
      <LegalSection heading="1. Overview">
        <p>
          This Privacy Policy explains how <strong>[Company legal name]</strong> (“{site.name},” “we”)
          collects, uses, and protects information when you use {site.domain} (the “Service”). We aim
          to collect only what we need to run the Service well.
        </p>
      </LegalSection>

      <LegalSection heading="2. Information we collect">
        <ul>
          <li>
            <strong>Account data</strong> — name, email, and password (hashed), handled via our auth
            provider, Supabase.
          </li>
          <li>
            <strong>Billing data</strong> — subscription status and the last four digits / card brand
            of your payment method. Full card details are collected and stored by Stripe, not by us.
          </li>
          <li>
            <strong>Customer Data</strong> — the content you create or upload while using the Service.
          </li>
          <li>
            <strong>Usage & device data</strong> — log data, IP address, browser/device type, and
            product analytics (via Vercel Analytics) to understand and improve the Service.
          </li>
          <li>
            <strong>Support data</strong> — messages you send us at {site.email}.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. How we use information">
        <ul>
          <li>Provide, secure, and maintain the Service;</li>
          <li>Process payments and manage subscriptions;</li>
          <li>Respond to support requests and send service-related notices;</li>
          <li>Improve features, performance, and reliability;</li>
          <li>Detect, prevent, and address fraud or abuse, and comply with law.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Legal bases (EEA/UK)">
        <p>
          Where applicable, we process personal data to perform our contract with you, for our
          legitimate interests (e.g., securing and improving the Service), to comply with legal
          obligations, and with your consent where required.
        </p>
      </LegalSection>

      <LegalSection heading="5. Subprocessors & sharing">
        <p>We don’t sell your personal data. We share it only with service providers that help us run the Service:</p>
        <ul>
          <li><strong>Supabase</strong> — database & authentication;</li>
          <li><strong>Stripe</strong> — payment processing;</li>
          <li><strong>Resend</strong> — transactional email;</li>
          <li><strong>Vercel</strong> — hosting & analytics.</li>
        </ul>
        <p>We may also disclose information to comply with law or to protect rights, safety, and security.</p>
      </LegalSection>

      <LegalSection heading="6. Data retention">
        <p>
          We retain personal data while your account is active and as needed to provide the Service.
          After account closure we delete or anonymize data within [30–90] days, except where we must
          retain it for legal, tax, or security reasons.
        </p>
      </LegalSection>

      <LegalSection heading="7. Security">
        <p>
          We use industry-standard measures including encryption in transit, row-level access controls
          on our database, and least-privilege access. No method of transmission or storage is 100%
          secure, but we work to protect your information and review our practices regularly.
        </p>
      </LegalSection>

      <LegalSection heading="8. Your rights">
        <p>
          Depending on your location, you may have the right to access, correct, export, or delete your
          personal data, and to object to or restrict certain processing. To exercise these rights,
          contact <a href={`mailto:${site.email}`}>{site.email}</a>. You can also access and update much
          of your data directly in your account settings.
        </p>
      </LegalSection>

      <LegalSection heading="9. International transfers">
        <p>
          We and our subprocessors may process data in countries other than yours. Where required, we
          rely on appropriate safeguards (such as Standard Contractual Clauses) for these transfers.
        </p>
      </LegalSection>

      <LegalSection heading="10. Cookies">
        <p>
          We use essential cookies to keep you signed in and to operate the Service, and limited
          analytics cookies to understand usage. [Add a cookie banner / preferences link here if your
          jurisdiction requires consent.]
        </p>
      </LegalSection>

      <LegalSection heading="11. Children">
        <p>The Service isn’t directed to children under 16, and we don’t knowingly collect their data.</p>
      </LegalSection>

      <LegalSection heading="12. Changes">
        <p>
          We may update this Policy from time to time. Material changes will be notified in-app or by
          email, and the “last updated” date above will change.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact">
        <p>
          For privacy questions or requests, contact <a href={`mailto:${site.email}`}>{site.email}</a>{" "}
          or [Company legal name], [mailing address]. [Name a data-protection contact/DPO if required.]
        </p>
      </LegalSection>
    </LegalPage>
  );
}
