export type ThemeStyleMap = {
  templateId: string;
  archetype: 'MINIMAL' | 'VIBRANT' | 'CHIC' | 'CLASSIC';
  primaryText: string;
  primaryBg: string;
  primaryBgHover: string;
  glassPanel: string;
  shadowStrong: string;
  fontHeadingClass: string;
  fontBodyClass: string;
  radiusClass: string;
};

export const getThemeTokens = (templateId: string, customColor: string = '#2563eb', config: any = {}): ThemeStyleMap => {
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

  const id = templateId.toLowerCase();
  
  let archetype: 'MINIMAL' | 'VIBRANT' | 'CHIC' | 'CLASSIC' = 'CLASSIC';
  if (['modern-minimal', 'compact-urban'].includes(id)) archetype = 'MINIMAL';
  else if (['playful-vibrant', 'resort-tropical', 'nature-eco'].includes(id)) archetype = 'VIBRANT';
  else if (['luxury-gold', 'dark-elegance', 'boutique-chic'].includes(id)) archetype = 'CHIC';

  return {
    templateId: id,
    archetype,
    primaryText: 'text-primary-600',
    primaryBg: 'bg-primary-600',
    primaryBgHover: 'hover:bg-primary-700',
    glassPanel: 'bg-white/95 backdrop-blur-md border border-surface-200',
    shadowStrong: 'shadow-xl',
    fontHeadingClass: fontMap[fontH] || 'font-sans',
    fontBodyClass: fontMap[fontB] || 'font-sans',
    radiusClass: radius,
  };
};
