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


      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
    </NextIntlClientProvider>
  );
}
