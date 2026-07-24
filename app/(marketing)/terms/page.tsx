import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

/**
 * Terms of Service for The QR Gate. Reflects real behavior (3-active-QR free
 * plan, Pro via Stripe, pause/moderation of abusive QR codes). Not legal
 * advice — the operating legal entity, governing law, and venue must be
 * confirmed and the document reviewed by counsel before launch.
 */
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 24, 2026">
      <LegalSection heading="Review note">
        <p>
          These Terms describe how the Service works today. They are not legal advice. The operating
          legal entity, governing law, venue, and refund policy must be confirmed and this document
          reviewed by counsel before it is relied upon.
        </p>
      </LegalSection>

      <LegalSection heading="1. Agreement to terms">
        <p>
          These Terms of Service (“Terms”) are a binding agreement between you and the operator of{" "}
          <strong>{site.domain}</strong> (“{site.name},” “we,” “us”; operating entity to be confirmed).
          By creating an account or using the Service, you agree to these Terms. If you use the Service
          for an organization, you represent that you’re authorized to bind it.
        </p>
      </LegalSection>

      <LegalSection heading="2. The Service & eligibility">
        <p>
          {site.name} provides software to create, host, customize, download, and track QR codes. You
          must be at least 18 and able to form a binding contract. We may update or modify the Service
          over time; we’ll avoid materially reducing core functionality during a paid term.
        </p>
      </LegalSection>

      <LegalSection heading="3. Accounts & security">
        <ul>
          <li>You’re responsible for your credentials and all activity under your account.</li>
          <li>Provide accurate information and keep it current.</li>
          <li>Notify us promptly at <a href={`mailto:${site.email}`}>{site.email}</a> of any unauthorized use.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Plans, QR limits & billing">
        <p>
          Free accounts may keep up to <strong>three active (published) QR codes</strong> at a time.
          Archiving or pausing a QR frees a slot. The Pro plan removes this limit and is billed in
          advance on a recurring basis through our payment processor, Stripe; current pricing is on our
          pricing page.
        </p>
        <ul>
          <li><strong>Renewals.</strong> Paid plans renew automatically until cancelled. Cancel anytime from billing settings; access continues to the end of the paid period.</li>
          <li><strong>After cancellation.</strong> Your existing published QR codes keep working, but you cannot create new active QR codes beyond the free limit until you re-subscribe.</li>
          <li><strong>Taxes.</strong> Fees exclude taxes, which you’re responsible for where applicable.</li>
          <li><strong>Refunds.</strong> Except where required by law, payments are non-refundable (confirm your refund policy).</li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Your responsibility for QR content">
        <p>
          You are solely responsible for the destinations, links, files, and information you encode in
          or link from your QR codes, and for ensuring you have the rights to use them. For hosted QR
          codes, your content is served publicly — do not include anything you wouldn’t publish openly.
        </p>
      </LegalSection>

      <LegalSection heading="6. Prohibited content & conduct">
        <p>You agree not to use the Service to create, host, link to, or distribute:</p>
        <ul>
          <li>malware, phishing, scams, or content that deceives or defrauds people who scan the code;</li>
          <li>content that is illegal, infringing, or violates others’ rights or privacy;</li>
          <li>content that impersonates a person or organization, or misrepresents affiliation;</li>
          <li>spam, or bulk codes intended to abuse, harass, or mislead; and</li>
          <li>anything that disrupts the Service or attempts unauthorized access.</li>
        </ul>
        <p>
          You also agree not to reverse engineer, resell, or scrape the Service without authorization.
        </p>
      </LegalSection>

      <LegalSection heading="7. Moderation & enforcement">
        <p>
          We may review, pause, disable, or remove QR codes or content, and suspend or terminate
          accounts, that we reasonably believe violate these Terms or the law, or that create risk to
          others — including pausing a hosted QR so it shows a notice instead of resolving. Where
          practical we’ll aim to notify you. Suspension blocks sign-in and publishing; your data is not
          deleted by suspension and may be restored if the account is reinstated.
        </p>
      </LegalSection>

      <LegalSection heading="8. Your content & ownership">
        <p>
          You retain all rights to the data and content you submit (“Customer Data”). You grant us a
          limited license to host, process, and display Customer Data solely to provide the Service
          (including serving your hosted QR pages). We own the Service, software, and our trademarks;
          these Terms grant you a limited, non-exclusive, non-transferable right to use the Service.
        </p>
      </LegalSection>

      <LegalSection heading="9. Third-party services">
        <p>
          The Service relies on Supabase (database, auth, storage), Stripe (payments), Resend (email),
          and Vercel (hosting). Your use may also be subject to their terms. See our{" "}
          <a href="/privacy">Privacy Policy</a> for details.
        </p>
      </LegalSection>

      <LegalSection heading="10. Availability">
        <p>
          We work to keep the Service available and reliable but do not guarantee uninterrupted or
          error-free operation. We may perform maintenance and may change or discontinue features. A QR
          code’s reliability also depends on the scanning device and the destination you choose — always
          test a code before printing or distributing it.
        </p>
      </LegalSection>

      <LegalSection heading="11. Disclaimers">
        <p>
          The Service is provided “as is” and “as available” without warranties of any kind, express or
          implied, including merchantability, fitness for a particular purpose, and non-infringement.
        </p>
      </LegalSection>

      <LegalSection heading="12. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {site.name} will not be liable for indirect,
          incidental, special, consequential, or punitive damages, or for lost profits or data. Our
          total liability for any claim is limited to the amount you paid us in the 12 months before the
          event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection heading="13. Termination">
        <p>
          You may stop using the Service and cancel at any time. We may suspend or terminate access for
          breach of these Terms or to comply with law. On termination, your right to use the Service
          ends; contact us to export or delete your data.
        </p>
      </LegalSection>

      <LegalSection heading="14. Changes; governing law">
        <p>
          We may update these Terms; if changes are material we’ll give notice before they take effect,
          and continued use means you accept them. These Terms are governed by the laws of the operator’s
          jurisdiction (to be confirmed), without regard to conflict-of-laws rules.
        </p>
      </LegalSection>

      <LegalSection heading="15. Independence & trademarks">
        <p>
          {site.incumbent.name} is a trademark of its respective owner. {site.name} is independent and
          not affiliated with, endorsed by, or sponsored by {site.incumbent.name}. Any comparisons are
          informational and reflect publicly available information believed accurate as of the date
          stated.
        </p>
      </LegalSection>

      <LegalSection heading="16. Contact">
        <p>
          Questions about these Terms? Contact <a href={`mailto:${site.email}`}>{site.email}</a>.{" "}
          {site.name} is a Halfstack product.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
