export type ThemeArchetype = 'CLASSIC' | 'MINIMAL' | 'CHIC' | 'VIBRANT';

export type ThemeStyleMap = {
  primaryBg: string;
  primaryBgHover: string;
  primaryText: string;
  secondaryText: string;
  glassPanel: string;
  neumorphicPanel: string;
  shadowStrong: string;
  archetype: ThemeArchetype;
  fontHeadingClass: string;
  fontBodyClass: string;
  radiusClass: string;
};

export const getThemeArchetype = (templateId: string): ThemeArchetype => {
  switch (templateId) {
    case 'modern-minimal':
    case 'compact-urban':
    case 'nature-eco':
      return 'MINIMAL';
      
    case 'luxury-gold':
    case 'boutique-chic':
    case 'dark-elegance':
      return 'CHIC';
      
    case 'corporate-trust':
    case 'classic-heritage':
    case 'retro-vintage':
      return 'CLASSIC';
      
    case 'resort-tropical':
    case 'playful-vibrant':
    case 'abstract-art':
    default:
      return 'VIBRANT';
  }
};

export const getThemeTokens = (templateId: string, customColor: string = '#2563eb', config: any = {}): ThemeStyleMap => {
  const archetype = getThemeArchetype(templateId);
  
  // Safe extraction of font and radius from config
  const fontH = config.fontHeading || 'inter';
  const fontB = config.fontBody || 'inter';
  const radius = config.borderRadius || 'rounded-xl';

  // Map user selects to standard Tailwind typography classes
  const fontMap: Record<string, string> = {
    'inter': 'font-sans',
    'playfair': 'font-serif',
    'montserrat': 'font-sans tracking-tight',
    'merriweather': 'font-serif leading-relaxed',
    'roboto': 'font-sans',
    'open-sans': 'font-sans leading-loose',
    'lato': 'font-sans font-light',
  };

  return {
    archetype,
    fontHeadingClass: fontMap[fontH] || 'font-sans',
    fontBodyClass: fontMap[fontB] || 'font-sans',
    radiusClass: radius,
    primaryBg: 'bg-[var(--brand-color)]',
    primaryBgHover: 'hover:bg-[var(--brand-color)] hover:brightness-110',
    primaryText: 'text-[var(--brand-color)]',
    secondaryText: 'text-surface-500',
    glassPanel: 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm',
    neumorphicPanel: `bg-surface-50 shadow-[8px_8px_16px_#e5e7eb,-8px_-8px_16px_#ffffff] ${radius}`,
    shadowStrong: 'shadow-xl shadow-black/10',
  };
};
