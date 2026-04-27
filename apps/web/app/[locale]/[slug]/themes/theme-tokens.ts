export type ThemeStyleMap = {
  templateId: string;
  archetype: 'MINIMAL' | 'VIBRANT' | 'CHIC' | 'CLASSIC';
  primaryText: string;
  primaryBg: string;
  primaryBgHover: string;
  primaryBgSoft: string;
  primaryBgFaint: string;
  glassPanel: string;
  shadowStrong: string;
  fontHeadingClass: string;
  fontBodyClass: string;
  radiusClass: string;
};

export const getThemeTokens = (templateId: string, customColor: string = '#2563eb', config: any = {}): ThemeStyleMap => {
  const fontH = config.fontHeading || 'inter';
  const fontB = config.fontBody || 'inter';
  const radius = config.borderRadius || 'rounded-xl';

  // Each value is a complete static literal so Tailwind JIT picks it up.
  const fontMap: Record<string, string> = {
    'inter': 'font-sans',
    'playfair': 'font-playfair',
    'montserrat': 'font-montserrat',
    'merriweather': 'font-merriweather',
    'roboto': 'font-roboto',
    'open-sans': 'font-open-sans',
    'lato': 'font-lato',
  };

  const id = templateId.toLowerCase();

  let archetype: 'MINIMAL' | 'VIBRANT' | 'CHIC' | 'CLASSIC' = 'CLASSIC';
  if (['modern-minimal', 'compact-urban'].includes(id)) archetype = 'MINIMAL';
  else if (['playful-vibrant', 'resort-tropical', 'nature-eco'].includes(id)) archetype = 'VIBRANT';
  else if (['luxury-gold', 'dark-elegance', 'boutique-chic'].includes(id)) archetype = 'CHIC';

  return {
    templateId: id,
    archetype,
    // Drive primary surfaces from the user-picked brand color (CSS var).
    primaryText: 'text-brand',
    primaryBg: 'bg-brand',
    primaryBgHover: 'hover:bg-brand/90',
    primaryBgSoft: 'bg-brand/10',
    primaryBgFaint: 'bg-brand/5',
    glassPanel: 'bg-white/95 backdrop-blur-md border border-surface-200',
    shadowStrong: 'shadow-xl',
    fontHeadingClass: fontMap[fontH] || 'font-sans',
    fontBodyClass: fontMap[fontB] || 'font-sans',
    radiusClass: radius,
  };
};
