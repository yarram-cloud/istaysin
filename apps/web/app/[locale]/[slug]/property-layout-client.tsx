'use client';

import { ReactNode } from 'react';
import { getThemeTokens } from './themes/theme-tokens';
import ThemedFooter from './themes/themed-footer';

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    return `${parseInt(cleanHex[0] + cleanHex[0], 16)}, ${parseInt(cleanHex[1] + cleanHex[1], 16)}, ${parseInt(cleanHex[2] + cleanHex[2], 16)}`;
  }
  if (cleanHex.length === 6) {
    return `${parseInt(cleanHex.substring(0, 2), 16)}, ${parseInt(cleanHex.substring(2, 4), 16)}, ${parseInt(cleanHex.substring(4, 6), 16)}`;
  }
  return '37, 99, 235'; // blue-600 fallback
}

export default function PropertyLayoutClient({ config, children, property }: { config: any, children: ReactNode, property: any }) {
  const themeTokens = getThemeTokens(config.theme || 'default', property.primaryColor || '#2563eb', config);
  const components = config.components || {};
  const brandColor = property.primaryColor || '#2563eb';
  const brandColorRgb = hexToRgb(brandColor);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans relative selection:bg-black/10">
      {/* Dynamic CSS Custom Properties injected at root to cascade to all component variants */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --brand-color: ${brandColor};
            --brand-color-rgb: ${brandColorRgb};
          }
        `
      }} />
      <main className="flex-1 w-full flex flex-col relative z-0">
        {children}
      </main>
      <ThemedFooter config={components.footer || {}} property={property} themeTokens={themeTokens} />
    </div>
  );
}
