import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/api';
import PropertyLayoutClient from './property-layout-client';
import ThemedHeader from './themes/themed-header';
import ThemedHero from './themes/themed-hero';
import BookingWidget from './booking-widget';
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

  const config = property.config?.websiteBuilder || {};
  const themeTokens = getThemeTokens(config.templateId || 'default', config.primaryColor);

  return (
    <PropertyLayoutClient config={config} property={property}>
      {/* Absolute floating Booking Widget for Desktop, Sticky for Mobile */}
      <ThemedHeader config={config} property={property} themeTokens={themeTokens} locale={params.locale} />

      <ThemedHero config={config} property={property} themeTokens={themeTokens} />

      <div className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative -mt-16 lg:mt-0 z-20">

        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-0 rounded-3xl overflow-hidden bg-white shadow-2xl">
          <ThemedAbout config={config} property={property} themeTokens={themeTokens} />
          <ThemedAmenities config={config} themeTokens={themeTokens} />
          <ThemedRooms property={property} locale={params.locale} propertySlug={params.slug} themeTokens={themeTokens} />
          <ThemedGallery config={config} themeTokens={themeTokens} />
          <ThemedStats config={config} themeTokens={themeTokens} />
          <ThemedNearby config={config} themeTokens={themeTokens} />
          <ThemedReviews property={property} themeTokens={themeTokens} />
          <ThemedFaq config={config} themeTokens={themeTokens} />
          <ThemedPolicies property={property} themeTokens={themeTokens} />
        </div>

        {/* Sidebar / Booking Engine */}
        <div className="lg:col-span-4 relative order-first lg:order-last">
          {/* A container to allow the widget to float over the hero image on desktop before scrolling */}
          <div className="lg:-mt-24 sticky top-24 pt-4 pb-24">
            <BookingWidget propertySlug={params.slug} locale={params.locale} config={config} />
          </div>
        </div>

      </div>
    </PropertyLayoutClient>
  );
}
