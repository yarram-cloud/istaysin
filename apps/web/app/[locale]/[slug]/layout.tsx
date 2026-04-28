import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import HtmlInjector from './html-injector';

function hexToRgb(hex: string) {
  const cleanHex = (hex || '').replace('#', '');
  if (cleanHex.length === 3) {
    return `${parseInt(cleanHex[0] + cleanHex[0], 16)}, ${parseInt(cleanHex[1] + cleanHex[1], 16)}, ${parseInt(cleanHex[2] + cleanHex[2], 16)}`;
  }
  if (cleanHex.length === 6) {
    return `${parseInt(cleanHex.substring(0, 2), 16)}, ${parseInt(cleanHex.substring(2, 4), 16)}, ${parseInt(cleanHex.substring(4, 6), 16)}`;
  }
  return '37, 99, 235';
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await publicApi.property(params.slug);
    if (!res.success || !res.data) return {};

    const d = res.data;
    const seo = d.config?.websiteBuilder?.components?.seo || {};

    const title = seo.title?.trim() || `${d.name} | Book Now`;
    const description = seo.description?.trim() || d.description || d.tagline || 'Book your stay with us.';
    const keywords = seo.keywords?.trim() || undefined;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        images: d.heroImage ? [d.heroImage] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function PropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string; locale: string };
}) {
  let property = null;
  try {
    const res = await publicApi.property(params.slug);
    if (res.success && res.data) {
      property = res.data;
    }
  } catch (error: any) {
    console.error('[PropertyLayout] Failed to load property:', error.message);
  }

  if (!property) {
    notFound();
  }

  const config = property.config?.websiteBuilder || {};
  const components = config.components || {};
  const primaryColor = property.primaryColor || '#0ea5e9';
  const secondaryColor = property.secondaryColor || '#38bdf8';
  const customCss: string = components.advanced?.customCss || '';
  const headScripts: string = components.scripts?.head || '';
  const bodyScripts: string = components.scripts?.body || '';

  const messages = await getMessages();

  const themeStyles = `
    :root {
      --brand-color: ${primaryColor};
      --brand-color-rgb: ${hexToRgb(primaryColor)};
      --brand-color-secondary: ${secondaryColor};
      --brand-color-secondary-rgb: ${hexToRgb(secondaryColor)};
      --property-primary: ${primaryColor};
      --property-secondary: ${secondaryColor};
    }

    .property-theme-primary { background-color: var(--property-primary); }
    .property-theme-text { color: var(--property-primary); }
    .property-theme-border { border-color: var(--property-primary); }
    .property-theme-hover:hover { filter: brightness(1.1); }

    /* Reusable gradient utility that uses both brand colors. Themes can opt in via class. */
    .brand-gradient-bg {
      background-image: linear-gradient(135deg, var(--brand-color) 0%, var(--brand-color-secondary) 100%);
    }
    .brand-gradient-text {
      background-image: linear-gradient(135deg, var(--brand-color) 0%, var(--brand-color-secondary) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  `;

  // ── Build LodgingBusiness JSON-LD ─────────────────────────────────────────
  // Maps propertyType enum to the most specific Schema.org sub-type for richer
  // Google Hotel Search eligibility and correct lodging classification.
  const SCHEMA_TYPE_MAP: Record<string, string> = {
    hotel: 'Hotel',
    resort: 'Resort',
    hostel: 'Hostel',
    lodge: 'LodgingBusiness',
    homestay: 'BedAndBreakfast',
    guest_house: 'GuestHouse',
    pg: 'LodgingBusiness',
  };
  const schemaType = SCHEMA_TYPE_MAP[property.propertyType || ''] || 'LodgingBusiness';

  // Aggregate rating from published reviews
  const reviewRatings = (property.reviews || []).map((r: any) => r.rating).filter(Boolean);
  const avgRating = reviewRatings.length > 0
    ? (reviewRatings.reduce((s: number, r: number) => s + r, 0) / reviewRatings.length).toFixed(1)
    : null;

  // Room types → containsPlace entries (gives Google room-level price awareness)
  const containsPlace = (property.roomTypes || []).map((rt: any) => ({
    '@type': 'HotelRoom',
    'name': rt.name,
    'description': rt.description || undefined,
    'occupancy': {
      '@type': 'QuantitativeValue',
      'maxValue': rt.maxOccupancy || 2,
    },
    ...(rt.baseRate ? {
      'offers': {
        '@type': 'Offer',
        'priceSpecification': {
          '@type': 'UnitPriceSpecification',
          'price': rt.baseRate,
          'priceCurrency': 'INR',
          'unitCode': rt.pricingUnit === 'monthly' ? 'MON' : 'DAY',
        },
      },
    } : {}),
  }));

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    'name': property.name,
    ...(property.description ? { 'description': property.description } : {}),
    ...(property.tagline ? { 'slogan': property.tagline } : {}),
    ...(property.heroImage ? { 'image': property.heroImage } : {}),
    ...(property.contactPhone ? { 'telephone': property.contactPhone } : {}),
    ...(property.contactEmail ? { 'email': property.contactEmail } : {}),
    'address': {
      '@type': 'PostalAddress',
      ...(property.address ? { 'streetAddress': property.address } : {}),
      ...(property.city ? { 'addressLocality': property.city } : {}),
      ...(property.state ? { 'addressRegion': property.state } : {}),
      ...(property.pincode ? { 'postalCode': property.pincode } : {}),
      'addressCountry': 'IN',
    },
    ...(property.latitude && property.longitude ? {
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': property.latitude,
        'longitude': property.longitude,
      },
    } : {}),
    ...(property.defaultCheckInTime ? { 'checkinTime': property.defaultCheckInTime } : {}),
    ...(property.defaultCheckOutTime ? { 'checkoutTime': property.defaultCheckOutTime } : {}),
    ...(avgRating ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': avgRating,
        'reviewCount': reviewRatings.length,
        'bestRating': '5',
        'worstRating': '1',
      },
    } : {}),
    ...(containsPlace.length > 0 ? { 'containsPlace': containsPlace } : {}),
  };

  // No <main> here — PropertyLayoutClient owns the main landmark to avoid nested <main> elements.
  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen bg-surface-50 text-surface-900 font-sans flex flex-col">
        {/* ── Schema.org LodgingBusiness JSON-LD ──────────────────────────────
             Required for Google Hotel Search eligibility and rich results.
             Rendered server-side so it's available on the first byte to crawlers.
        ────────────────────────────────────────────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        {headScripts && <HtmlInjector html={headScripts} location="head" />}

        {children}

        {bodyScripts && <HtmlInjector html={bodyScripts} location="body" />}
      </div>
    </NextIntlClientProvider>
  );
}
