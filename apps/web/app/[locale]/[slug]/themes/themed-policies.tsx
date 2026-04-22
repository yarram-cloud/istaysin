import { ThemeStyleMap } from './theme-tokens';
import { Info, Clock, ShieldAlert, Baby, Dog } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ThemedPolicies({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  const t = useTranslations('PropertySite');
  if (!config.enabled) return null;

  // Prefer CMS structured rules over hardcoded defaults
  const cmsRules = (config.rules || []).map((r: any) => ({
    title: r.title || '',
    icon: Info,
    value: r.description || ''
  }));
  const fallbackPolicies = [
    { title: t('checkInTime'), icon: Clock, value: property.checkInTime || t('defaultCheckIn') },
    { title: t('checkOutTime'), icon: Clock, value: property.checkOutTime || t('defaultCheckOut') },
    { title: t('cancellation'), icon: ShieldAlert, value: property.cancellationPolicy || t('defaultCancellation') },
    { title: t('childPolicy'), icon: Baby, value: t('defaultChildPolicy') },
    { title: t('pets'), icon: Dog, value: property.petsAllowed ? t('petsWelcome') : t('petsNotAllowed') }
  ];
  const defaultPolicies = cmsRules.length > 0 ? cmsRules : fallbackPolicies;

  // --- VIBRANT ARCHETYPE ---
  if (themeTokens.archetype === 'VIBRANT') {
    return (
      <section className="py-24 bg-surface-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className={`text-5xl md:text-6xl font-black text-surface-900 mb-16 text-center ${themeTokens.fontHeadingClass}`}>{config.title || t('thingsToKnow')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultPolicies.map((policy, i) => (
              <div key={i} className={`bg-white p-8 ${themeTokens.radiusClass} border-2 border-surface-100 hover:border-[color:var(--brand-color,#000)] transition-colors shadow-xl flex flex-col items-start`}>
                 <div className={`w-14 h-14 ${themeTokens.radiusClass} bg-surface-100 flex items-center justify-center mb-6`}>
                   <policy.icon className={`w-6 h-6 ${themeTokens.primaryText}`} />
                 </div>
                 <h4 className={`text-xl font-black text-surface-900 mb-3 ${themeTokens.fontHeadingClass}`}>{policy.title}</h4>
                 <p className={`text-surface-600 font-medium ${themeTokens.fontBodyClass}`}>{policy.value}</p>
              </div>
            ))}
          </div>

          <div className={`mt-12 bg-surface-900 text-white p-8 ${themeTokens.radiusClass} flex items-center gap-6`}>
             <Info className="w-8 h-8 shrink-0 text-amber-400" />
             <p className={`font-bold ${themeTokens.fontBodyClass}`}>{t('idRequirementInfo')}</p>
          </div>
        </div>
      </section>
    );
  }

  // --- MINIMAL ARCHETYPE ---
  if (themeTokens.archetype === 'MINIMAL') {
    return (
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className={`text-3xl font-light text-surface-900 mb-16 tracking-wide border-b border-surface-200 pb-6 ${themeTokens.fontHeadingClass}`}>{config.title || t('policies')}</h3>
          
          <div className="space-y-12">
            {defaultPolicies.map((policy, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8 group">
                <div className="sm:col-span-4 flex items-center gap-4">
                  <policy.icon className="w-4 h-4 text-surface-300 group-hover:text-black transition-colors" />
                  <h4 className={`text-sm uppercase tracking-widest text-surface-500 group-hover:text-black transition-colors ${themeTokens.fontHeadingClass}`}>{policy.title}</h4>
                </div>
                <div className="sm:col-span-8">
                  <p className={`text-xl text-surface-700 font-light ${themeTokens.fontBodyClass}`}>{policy.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-8 border-t border-surface-100 flex gap-4">
            <Info className="w-4 h-4 mt-1 text-surface-400 shrink-0" />
            <p className={`text-sm text-surface-500 font-light leading-relaxed ${themeTokens.fontBodyClass}`}>
              {t('idRequirementInfo')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // --- CHIC ARCHETYPE ---
  if (themeTokens.archetype === 'CHIC') {
    return (
      <section className="py-24 bg-surface-950 text-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="md:col-span-1 border-r border-surface-800 pr-16 hidden md:block">
              <h3 className={`text-4xl text-white mb-6 leading-tight ${themeTokens.fontHeadingClass}`}>{config.title || t('policies')}</h3>
              <p className={`text-surface-400 font-light ${themeTokens.fontBodyClass}`}>{t('reviewHouseRules')}</p>
            </div>
            
            <div className="md:col-span-2">
              <h3 className={`text-4xl text-white mb-12 md:hidden ${themeTokens.fontHeadingClass}`}>{config.title || t('policies')}</h3>
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-16">
                 {defaultPolicies.map((policy, i) => (
                   <div key={i} className="group">
                     <div className="flex items-center gap-4 mb-4">
                       <h4 className={`text-sm uppercase tracking-[0.2em] text-surface-300 group-hover:text-white transition-colors ${themeTokens.fontHeadingClass}`}>{policy.title}</h4>
                     </div>
                     <p className={`text-lg text-surface-500 group-hover:text-surface-300 transition-colors ${themeTokens.fontBodyClass}`}>{policy.value}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- CLASSIC (Default) ---
  return (
    <section className="py-24 bg-surface-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h3 className={`text-3xl md:text-4xl font-bold text-surface-900 mb-6 flex items-center justify-center gap-3 ${themeTokens.fontHeadingClass}`}>
            <Info className={`w-8 h-8 ${themeTokens.primaryText}`} />
            {config.title || t('propertyPolicies')}
          </h3>
          <div className="w-16 h-1 bg-surface-300 mx-auto"></div>
        </div>

        <div className={`bg-white ${themeTokens.radiusClass} border border-surface-200 p-8 md:p-12 shadow-sm`}>
          <dl className="space-y-6 divide-y divide-surface-100">
            {defaultPolicies.map((policy, i) => (
              <div key={i} className={`flex flex-col sm:flex-row gap-2 sm:gap-8 ${i !== 0 ? 'pt-6' : ''}`}>
                <dt className={`w-48 font-semibold text-surface-900 shrink-0 flex items-center gap-2 ${themeTokens.fontHeadingClass}`}>
                  <policy.icon className={`w-4 h-4 ${themeTokens.primaryText}`} />
                  {policy.title}
                </dt>
                <dd className={`text-surface-600 flex-1 ${themeTokens.fontBodyClass}`}>{policy.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 pt-8 border-t border-surface-200 bg-surface-50 p-6 rounded-2xl">
            <p className={`text-sm text-surface-600 italic block font-medium ${themeTokens.fontBodyClass}`}>
              {t('idRequirementInfo')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
