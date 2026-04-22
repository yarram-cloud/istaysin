import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await publicApi.property(params.slug);
    if (!res.success || !res.data) return {};

    return {
      title: `${res.data.name} | Book Now`,
      description: res.data.description || res.data.tagline || 'Book your stay with us.',
      openGraph: {
        images: res.data.heroImage ? [res.data.heroImage] : [],
      }
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

  // Extract config
  const config = property.config?.websiteBuilder || {};
  const primaryColor = property.primaryColor || '#0ea5e9';
  const secondaryColor = property.secondaryColor || '#38bdf8';

  // Get messages for client components
  const messages = await getMessages();

  // Inject CSS variables for the property theme
  const customStyles = `
    :root {
      --property-primary: ${primaryColor};
      --property-secondary: ${secondaryColor};
    }
    
    .property-theme-primary { background-color: var(--property-primary); }
    .property-theme-text { color: var(--property-primary); }
    .property-theme-border { border-color: var(--property-primary); }
    .property-theme-hover:hover { filter: brightness(1.1); }
  `;

  return (
    <NextIntlClientProvider messages={messages}>
    <div className="min-h-screen bg-surface-50 text-surface-900 font-sans flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />


      {/* Property Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {property.brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={property.brandLogo} alt={property.name} className="h-12 w-auto object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-xl property-theme-primary flex items-center justify-center text-white font-bold text-xl">
                {property.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{property.name}</h1>
              {property.tagline && <p className="text-sm text-surface-500 hidden sm:block">{property.tagline}</p>}
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
            <a href="#about" className="hover:property-theme-text transition-colors">About</a>
            <a href="#rooms" className="hover:property-theme-text transition-colors">Rooms</a>
            <a href="#amenities" className="hover:property-theme-text transition-colors">Amenities</a>
            <a href="#reviews" className="hover:property-theme-text transition-colors">Reviews</a>
          </nav>
          <a
            href={`/${params.locale}/${params.slug}/book`}
            className="property-theme-primary property-theme-hover text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm"
          >
            Book Now
          </a>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Property Footer */}
      <footer className="bg-surface-950 text-surface-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">{property.name}</h3>
            <p className="text-sm mb-4">{property.address}, {property.city}, {property.state} {property.pincode}</p>
            <p className="text-sm">📞 {property.contactPhone}</p>
            <p className="text-sm">✉️ {property.contactEmail}</p>
          </div>
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#rooms" className="hover:text-white transition-colors">Our Rooms</a></li>
              <li><a href="#reviews" className="hover:text-white transition-colors">Guest Reviews</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Connect With Us</h3>
            <div className="flex gap-4">
              {config.socialLinks?.facebook && (
                <a href={config.socialLinks.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center hover:bg-surface-700 transition-colors">
                  <span className="sr-only">Facebook</span>
                  FB
                </a>
              )}
              {config.socialLinks?.instagram && (
                <a href={config.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center hover:bg-surface-700 transition-colors">
                  <span className="sr-only">Instagram</span>
                  IG
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-surface-800 text-sm text-center">
          {config.footerText || `© ${new Date().getFullYear()} ${property.name}. All rights reserved.`}
          <div className="mt-2 text-xs text-surface-600">Powered by iStays</div>
        </div>
      </footer>
    </div>
    </NextIntlClientProvider>
  );
}
