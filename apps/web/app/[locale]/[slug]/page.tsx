import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/api';
import PropertyLayoutClient from './property-layout-client';

/**
 * ISR — cache the rendered HTML at the edge for 60 s, then revalidate in
 * the background on the next request. Cuts page-load latency for India
 * visitors hitting a US-hosted origin from ~600 ms to <100 ms after the
 * first request warms the cache.
 *
 * Manual invalidation: when an owner saves the website builder, the API
 * fires `POST /api/revalidate` (see app/api/revalidate/route.ts) so the
 * change shows up immediately rather than within the 60 s window.
 */
export const revalidate = 60;
import ThemedHeader from './themes/themed-header';
import ThemedHero from './themes/themed-hero';
import BookingWidgetWrapper from './themes/themed-booking-widget';
import ThemedAbout from './themes/themed-about';
import ThemedAmenities from './themes/themed-amenities';
import ThemedRooms from './themes/themed-rooms';
import ThemedGallery from './themes/themed-gallery';
import ThemedNearby from './themes/themed-nearby';
import ThemedStats from './themes/themed-stats';
import ThemedFaq from './themes/themed-faq';
import ThemedPolicies from './themes/themed-policies';
import ThemedReviews from './themes/themed-reviews';
import { getThemeTokens } from './themes/theme-tokens';
import ThemedLocation from './themes/themed-location';
import ThemedAwards from './themes/themed-awards';
import ThemedOffers from './themes/themed-offers';
import ThemedContact from './themes/themed-contact';
import ThemedRateComparison from './themes/themed-rate-comparison';

export default async function PropertyHomePage({ params }: { params: { slug: string; locale: string } }) {
  let property = null;

  try {
    const res = await publicApi.property(params.slug);
    if (res.success && res.data) {
      property = res.data;
    }
  } catch (error) {
    console.error('Failed to load property:', error);
  }

  if (!property) {
    notFound();
  }

  // Fetch competitor rates; widget is optional — never block page load on failure
  let rateComparisonData: { enabled: boolean; rates: Record<string, Record<string, number>>; lastUpdated?: string } | null = null;
  try {
    const rateRes = await publicApi.getRateComparison(params.slug);
    if (rateRes.success && rateRes.data) {
      rateComparisonData = rateRes.data;
    }
  } catch {
    // silently skip — widget is decorative / additive
  }

  const config = property.config?.websiteBuilder || {};
  const components = config.components || {};
  const themeTokens = getThemeTokens(config.theme || 'default', property.primaryColor || '#2563eb', config);

  return (
    <PropertyLayoutClient config={config} property={property}>
      {/* Absolute floating Booking Widget for Desktop, Sticky for Mobile */}
      <ThemedHeader config={config} property={property} themeTokens={themeTokens} locale={params.locale} />

      <ThemedHero config={components.hero || {}} property={property} themeTokens={themeTokens} />

      <div className="w-full relative z-20 bg-surface-50">
        <ThemedAbout config={components.about || {}} property={property} themeTokens={themeTokens} />
        <ThemedAmenities config={components.amenities || {}} themeTokens={themeTokens} />
        <ThemedRooms config={components.rooms || {}} property={property} locale={params.locale} propertySlug={params.slug} themeTokens={themeTokens} />
        <ThemedRateComparison
          rateData={rateComparisonData}
          roomTypes={(property.roomTypes || []).map((rt: { id: string; name: string; baseRate: number }) => ({ id: rt.id, name: rt.name, baseRate: rt.baseRate }))}
          themeTokens={themeTokens}
        />
        <ThemedGallery config={components.gallery || {}} themeTokens={themeTokens} />
        <ThemedStats config={components.stats || {}} themeTokens={themeTokens} />
        <ThemedNearby config={components.nearby || {}} themeTokens={themeTokens} />
        <ThemedReviews config={components.reviews || {}} property={property} themeTokens={themeTokens} />
        <ThemedFaq config={components.faq || {}} themeTokens={themeTokens} />
        <ThemedPolicies config={components.policies || {}} property={property} themeTokens={themeTokens} />
        <ThemedLocation config={components.location || {}} property={property} themeTokens={themeTokens} />
        <ThemedAwards config={components.awards || {}} themeTokens={themeTokens} />
        <ThemedOffers config={components.offers || {}} property={property} themeTokens={themeTokens} />
        <ThemedContact config={components.contact || {}} property={property} themeTokens={themeTokens} />
      </div>

      <BookingWidgetWrapper propertySlug={params.slug} locale={params.locale} config={config} themeTokens={themeTokens} />
    </PropertyLayoutClient>
  );
}
