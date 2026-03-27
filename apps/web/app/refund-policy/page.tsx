import LegalLayout from '../../components/LegalLayout';

export const metadata = {
  title: 'Refund Policy | istaysin',
  description: 'Refund and cancellation policy for istaysin subscriptions.',
};

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" description="Refund and cancellation policy for istaysin subscriptions.">
      <p className="text-sm text-slate-400 mb-8">Last updated: March 27, 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-surface-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">1. Free Plan</h2>
          <p>
            The Free tier is available at no cost and requires no payment. There is nothing to refund.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">2. Paid Subscriptions</h2>
          <p>All paid plans (Starter, Professional, Enterprise) come with a <strong>14-day free trial</strong>. No refund requests are entertained for trial periods since no charge is made.</p>
          <p className="mt-2">After the trial, subscriptions are billed monthly. Refund eligibility:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Within 7 days</strong> of first paid charge: Full refund available, no questions asked</li>
            <li><strong>After 7 days:</strong> Pro-rated refund for unused portion of the current billing cycle</li>
            <li><strong>Annual plans:</strong> Full refund within 14 days of purchase; pro-rated refund within 60 days; no refund after 60 days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">3. How to Request a Refund</h2>
          <p>
            Send a refund request to{' '}
            <a href="mailto:billing@istaysin.com" className="text-primary-600 hover:underline">billing@istaysin.com</a>{' '}
            with your registered email, property name, and reason for the request. Refunds are processed 
            within 7–10 business days to the original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">4. Non-Refundable Items</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Custom domain setup fees (one-time)</li>
            <li>Custom development or integration work (Enterprise plans)</li>
            <li>SMS/notification credits that have already been consumed</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">5. Cancellation</h2>
          <p>
            You can cancel your subscription at any time from your dashboard. Upon cancellation, your 
            account remains active until the end of the current billing period. After that, your plan 
            downgrades to Free tier (data is preserved, feature access is limited).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-surface-800 mb-3">6. Contact</h2>
          <p>
            For billing queries, email{' '}
            <a href="mailto:billing@istaysin.com" className="text-primary-600 hover:underline">billing@istaysin.com</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
