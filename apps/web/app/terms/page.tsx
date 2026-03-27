import LegalLayout from '../../components/LegalLayout';

export const metadata = {
  title: 'Terms of Service | istaysin',
  description: 'Terms and conditions for using the istaysin platform.',
};

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" description="Terms and conditions for using the istaysin platform.">
      <p className="text-sm text-slate-400 mb-8">Last updated: March 27, 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-surface-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using istaysin (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. 
            If you are registering on behalf of a business or property, you represent that you have the 
            authority to bind that entity to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">2. Description of Service</h2>
          <p>
            istaysin provides a cloud-based hotel management platform including booking engine, room management, 
            guest check-in/out, billing, analytics, and branded website services. The platform is available 
            under various subscription plans as described on our pricing page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">3. Account Registration</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must provide accurate and complete information during registration</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must notify us immediately of any unauthorized access</li>
            <li>One account per person; duplicate registrations may be merged or removed</li>
            <li>Property registrations are subject to admin approval</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">4. Property Owner Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Ensure all property information (name, address, GST, licensing) is accurate and current</li>
            <li>Maintain compliance with local hospitality laws and regulations</li>
            <li>Handle guest data responsibly and in compliance with applicable privacy laws</li>
            <li>Properly record guest check-ins (Form-B) and foreign national reporting (C-Form)</li>
            <li>Ensure GST registration details are correct for invoice generation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">5. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Use the platform for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to other properties&apos; data</li>
            <li>Reverse engineer, decompile, or disassemble any part of the platform</li>
            <li>Upload malicious code or interfere with the platform&apos;s operation</li>
            <li>Use the platform to send unsolicited messages or spam</li>
            <li>Scrape or bulk-download data from the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">6. Subscription & Payments</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Free tier is available with usage limits as specified on the pricing page</li>
            <li>Paid plans are billed monthly and auto-renew unless cancelled</li>
            <li>Price changes are communicated 30 days in advance</li>
            <li>Downgrading may result in loss of features; data is preserved</li>
            <li>All prices are in INR and exclusive of applicable taxes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">7. Data Ownership</h2>
          <p>
            <strong>You own your data.</strong> All property data, guest records, booking information, and 
            financial records you enter into istaysin remain your intellectual property. We claim no ownership 
            over your content. Upon account termination, you may request a full data export.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">8. Service Availability</h2>
          <p>
            We target 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance windows 
            will be communicated in advance. We are not liable for downtime caused by force majeure events, 
            third-party service failures, or your network issues.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">9. Limitation of Liability</h2>
          <p>
            istaysin is provided &quot;as is&quot;. To the maximum extent permitted by law, we disclaim all warranties 
            and shall not be liable for indirect, incidental, or consequential damages arising from your use 
            of the platform. Our total liability shall not exceed the amount paid by you in the 12 months 
            preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">10. Termination</h2>
          <p>
            Either party may terminate this agreement at any time. Upon termination, your access to the 
            platform is revoked, but your data is retained for 30 days for export. We reserve the right to 
            suspend accounts that violate these terms without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">11. Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be resolved through arbitration 
            in Hyderabad, Telangana, in accordance with the Arbitration and Conciliation Act, 1996.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">12. Contact</h2>
          <p>
            For questions about these terms, email us at{' '}
            <a href="mailto:legal@istaysin.com" className="text-primary-600 hover:underline">legal@istaysin.com</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
