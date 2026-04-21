'use client';

import { ReactNode } from 'react';
import { getThemeTokens } from './themes/theme-tokens';
import ThemedFooter from './themes/themed-footer';

export default function PropertyLayoutClient({ config, children, property }: { config: any, children: ReactNode, property: any }) {
  const themeTokens = getThemeTokens(config.templateId || 'default', config.primaryColor);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans relative selection:bg-black/10">
      {/* Dynamic CSS Custom Properties injected at root to cascade to all component variants */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --brand-color: ${config.primaryColor || '#2563eb'};
          }
        `
      }} />
      <main className="flex-1 w-full flex flex-col relative z-0">
        {children}
      </main>
      <ThemedFooter config={config} property={property} themeTokens={themeTokens} />
    </div>
  );
}
