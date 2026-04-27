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
  `;

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen bg-surface-50 text-surface-900 font-sans flex flex-col">
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
        {headScripts && <HtmlInjector html={headScripts} location="head" />}

        <main className="flex-1 w-full">{children}</main>

        {bodyScripts && <HtmlInjector html={bodyScripts} location="body" />}
      </div>
    </NextIntlClientProvider>
  );
}
