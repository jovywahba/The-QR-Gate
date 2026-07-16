import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

// Template Terms. Customize the [bracketed] placeholders per product and have
// counsel review before launch (hard gate — root CLAUDE.md §10/§12).
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="June 18, 2026">
      <LegalSection heading="1. Agreement to terms">
        <p>
          These Terms of Service (“Terms”) are a binding agreement between you and{" "}
          <strong>[Company legal name]</strong> (“{site.name},” “we,” “us”), operator of the service
          available at <strong>{site.domain}</strong> (the “Service”). By creating an account or using
          the Service, you agree to these Terms. If you’re using the Service on behalf of an
          organization, you represent that you’re authorized to bind that organization.
        </p>
      </LegalSection>

      <LegalSection heading="2. The Service & eligibility">
        <p>
          {site.name} provides software for {site.tagline.toLowerCase()} You must be at least 18 and
          able to form a binding contract to use the Service. We may update, improve, or modify the
          Service over time; we’ll avoid materially reducing core functionality during a paid term.
        </p>
      </LegalSection>

      <LegalSection heading="3. Accounts & security">
        <ul>
          <li>You’re responsible for your account credentials and all activity under your account.</li>
          <li>Provide accurate information and keep it current.</li>
          <li>Notify us promptly at <a href={`mailto:${site.email}`}>{site.email}</a> of any unauthorized use.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Subscriptions, billing & trials">
        <p>
          Paid plans are billed in advance on a recurring basis (monthly or annually) through our
          payment processor, Stripe. Current pricing is shown on our pricing page.
        </p>
        <ul>
          <li>
            <strong>Free trial.</strong> Trials require a payment method. Unless you cancel before the
            trial ends, your plan converts to paid automatically at the then-current price.
          </li>
          <li>
            <strong>Renewals.</strong> Subscriptions renew automatically until cancelled. You can
            cancel anytime from your billing settings; access continues through the end of the paid
            period.
          </li>
          <li>
            <strong>Taxes.</strong> Fees are exclusive of taxes, which you’re responsible for where
            applicable.
          </li>
          <li>
            <strong>Refunds.</strong> Except where required by law, payments are non-refundable.
            [Adjust to your refund policy.]
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Break the law or infringe others’ rights using the Service;</li>
          <li>Reverse engineer, resell, or attempt to access the Service without authorization;</li>
          <li>Upload malware or disrupt the Service’s integrity or performance;</li>
          <li>Use the Service to send spam or store unlawful content.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Your content & ownership">
        <p>
          You retain all rights to the data and content you submit (“Customer Data”). You grant us a
          limited license to host and process Customer Data solely to provide and improve the Service.
          We own the Service, software, and our trademarks; these Terms grant you a limited,
          non-exclusive, non-transferable right to use the Service during your subscription.
        </p>
      </LegalSection>

      <LegalSection heading="7. Third-party services">
        <p>
          The Service relies on subprocessors including Supabase (database & authentication), Stripe
          (payments), Resend (email), and Vercel (hosting). Your use may also be subject to their
          terms. See our <a href="/privacy">Privacy Policy</a> for details.
        </p>
      </LegalSection>

      <LegalSection heading="8. Disclaimers">
        <p>
          The Service is provided “as is” and “as available” without warranties of any kind, whether
          express or implied, including merchantability, fitness for a particular purpose, and
          non-infringement. We don’t warrant that the Service will be uninterrupted or error-free.
        </p>
      </LegalSection>

      <LegalSection heading="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {site.name} and [Company legal name] will not be
          liable for indirect, incidental, special, consequential, or punitive damages, or for lost
          profits or data. Our total liability for any claim is limited to the amount you paid us in
          the 12 months before the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection heading="10. Termination">
        <p>
          You may stop using the Service and cancel at any time. We may suspend or terminate access
          for breach of these Terms or to comply with law. On termination, your right to use the
          Service ends; you may export Customer Data for [30] days, after which we may delete it.
        </p>
      </LegalSection>

      <LegalSection heading="11. Changes to these Terms">
        <p>
          We may update these Terms. If changes are material, we’ll provide notice (e.g., by email or
          in-app) before they take effect. Continued use after changes means you accept the updated
          Terms.
        </p>
      </LegalSection>

      <LegalSection heading="12. Governing law">
        <p>
          These Terms are governed by the laws of <strong>[governing law / jurisdiction]</strong>,
          without regard to conflict-of-laws rules. The courts located in{" "}
          <strong>[venue]</strong> will have exclusive jurisdiction.
        </p>
      </LegalSection>

      <LegalSection heading="13. Independence & trademarks">
        <p>
          {site.incumbent.name} is a trademark of its respective owner. {site.name} is independent and
          not affiliated with, endorsed by, or sponsored by {site.incumbent.name}. Any comparisons are
          for informational purposes and reflect publicly available information believed accurate as
          of the date stated.
        </p>
      </LegalSection>

      <LegalSection heading="14. Contact">
        <p>
          Questions about these Terms? Contact us at <a href={`mailto:${site.email}`}>{site.email}</a>
          {" "}or [Company legal name], [mailing address].
        </p>
      </LegalSection>
    </LegalPage>
  );
}
