import LegalLayout from '../../components/LegalLayout';

export const metadata = {
  title: 'Privacy Policy | istaysin',
  description: 'How istaysin collects, uses, and protects your personal information.',
};

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" description="How istaysin collects, uses, and protects your personal information.">
      <p className="text-sm text-slate-400 mb-8">Last updated: March 27, 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-surface-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">1. Information We Collect</h2>
          <p>When you register on istaysin, we collect the following information:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Account Information:</strong> Full name, email address, phone number, and password (stored as a secure hash).</li>
            <li><strong>Property Information:</strong> Property name, address, contact details, GST number, and property photos.</li>
            <li><strong>Guest Data:</strong> Names, contact details, ID proofs (for Form-B/C-Form compliance), and booking history, as entered by property staff.</li>
            <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, and interaction patterns for analytics and improvement.</li>
            <li><strong>Payment Data:</strong> We do not store credit card numbers. Payments are processed through PCI-DSS compliant payment gateways.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and maintain the istaysin platform and services</li>
            <li>To process bookings, check-ins, billing, and generate invoices</li>
            <li>To send transactional emails (booking confirmations, receipt notifications)</li>
            <li>To improve our platform through aggregated, anonymized analytics</li>
            <li>To comply with Indian legal requirements (GST, FHRAI reporting)</li>
            <li>To communicate important service updates and security notices</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">3. Data Isolation & Multi-Tenancy</h2>
          <p>
            istaysin operates on a multi-tenant architecture with <strong>row-level security (RLS)</strong>. 
            This means each property&apos;s data is strictly isolated at the database level. No property can 
            access, view, or modify another property&apos;s data, even in the event of an application-level bug.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">4. Data Sharing</h2>
          <p>We do <strong>not</strong> sell your data. We share information only in these cases:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Service providers:</strong> Email delivery (Resend), hosting (cloud providers), and payment processing, all bound by data processing agreements.</li>
            <li><strong>Legal compliance:</strong> When required by Indian law, court orders, or regulatory authorities.</li>
            <li><strong>With your consent:</strong> If you opt into OTA integrations, booking data is shared with the chosen platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">5. Data Security</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>All data is encrypted in transit using TLS 1.3</li>
            <li>Data at rest is protected with AES-256 encryption</li>
            <li>Passwords are hashed using bcrypt with salt rounds</li>
            <li>Access to production systems is restricted and audited</li>
            <li>Regular security assessments and dependency audits</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Access and download your data</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for marketing communications</li>
            <li>Lodge a complaint with the relevant data protection authority</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">7. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. Upon account deletion, personal 
            data is permanently removed within 30 days. Financial records (invoices, GST filings) are 
            retained for 8 years as required by Indian tax law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">8. Contact Us</h2>
          <p>
            For privacy-related queries, contact us at{' '}
            <a href="mailto:privacy@istaysin.com" className="text-primary-600 hover:underline">privacy@istaysin.com</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
