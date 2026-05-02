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

/**
 * Default brand colors curated per template for optimal contrast and visual harmony.
 * Used as a fallback when the property owner hasn't explicitly saved a custom primary color.
 */
export const DEFAULT_BRAND_COLORS: Record<string, string> = {
  'luxury-gold':        '#C6A55A',   // Rich gold
  'modern-minimal':     '#111111',   // Near-black
  'corporate-trust':    '#1E40AF',   // Deep corporate blue
  'boutique-chic':      '#B4637A',   // Dusty rose
  'dark-elegance':      '#FFFFFF',   // White accents on dark
  'classic-heritage':   '#8B6914',   // Heritage amber
  'resort-tropical':    '#0D9488',   // Deep teal
  'playful-vibrant':    '#E11D48',   // Vibrant rose-red
  'compact-urban':      '#3B82F6',   // Modern blue
  'retro-vintage':      '#DF5339',   // Retro red
  'nature-eco':         '#166534',   // Forest green
  'abstract-art':       '#7C3AED',   // Vivid violet
  // ── New ultra-premium templates ──
  'scandinavian-frost':  '#94A3B8',  // Cool slate
  'art-deco-glam':       '#D4AF37',  // Metallic gold
  'japanese-zen':        '#8B7355',  // Wabi-sabi brown
  'mediterranean-sun':   '#C2410C',  // Terracotta
  'industrial-loft':     '#78716C',  // Steel gray
  'royal-palace':        '#7E22CE',  // Deep purple
  'coastal-breeze':      '#0284C7',  // Ocean blue
  'neo-brutalist':       '#F97316',  // Signal orange
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
  if (['modern-minimal', 'compact-urban', 'scandinavian-frost', 'japanese-zen', 'industrial-loft'].includes(id)) archetype = 'MINIMAL';
  else if (['playful-vibrant', 'resort-tropical', 'nature-eco', 'mediterranean-sun', 'coastal-breeze'].includes(id)) archetype = 'VIBRANT';
  else if (['luxury-gold', 'dark-elegance', 'boutique-chic', 'art-deco-glam', 'royal-palace'].includes(id)) archetype = 'CHIC';

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
