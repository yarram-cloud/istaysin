import { ThemeStyleMap } from './theme-tokens';
import { Info } from 'lucide-react';

export default function ThemedPolicies({ property, themeTokens }: { property: any, themeTokens: ThemeStyleMap }) {
  const defaultPolicies = [
    { title: 'Check-in Time', value: property.checkInTime || '14:00 (2:00 PM)' },
    { title: 'Check-out Time', value: property.checkOutTime || '11:00 (11:00 AM)' },
    { title: 'Cancellation', value: property.cancellationPolicy || 'Standard 48-hour cancellation policy applies.' },
    { title: 'Child Policy', value: 'Children under 5 stay free with existing bedding.' },
    { title: 'Pets', value: property.petsAllowed ? 'Pets are welcome! Additional charges may apply.' : 'Pets are strictly not allowed.' }
  ];

  return (
    <section className="py-20 bg-surface-50">
      <div className="max-w-4xl mx-auto px-6">
        <h3 className="text-2xl font-bold text-surface-900 mb-8 flex items-center gap-3">
          <Info className={`w-6 h-6 ${themeTokens.primaryText}`} />
          Property Policies
        </h3>

        <div className="bg-white rounded-3xl border border-surface-200 p-8 shadow-sm">
          <dl className="space-y-6 divide-y divide-surface-100">
            {defaultPolicies.map((policy, i) => (
              <div key={i} className={`flex flex-col sm:flex-row gap-2 sm:gap-8 ${i !== 0 ? 'pt-6' : ''}`}>
                <dt className="w-48 font-semibold text-surface-900 shrink-0">{policy.title}</dt>
                <dd className="text-surface-600 flex-1">{policy.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 pt-8 border-t border-surface-200">
            <p className="text-sm text-surface-500 italic block">
              Note: Guests are required to show a photo identification upon check-in. Valid ID proofs include Passport, Aadhar Card, Driving License, or Voter ID.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
