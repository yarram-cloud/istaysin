export type ThemeStyleMap = {
  primaryBg: string;
  primaryBgHover: string;
  primaryText: string;
  secondaryText: string;
  glassPanel: string;
  neumorphicPanel: string;
  shadowStrong: string;
};

// Provides "ultra premium" glassmorphic defaults matching 14 different template archetypes.
export const getThemeTokens = (templateId: string, customColor: string = '#2563eb'): ThemeStyleMap => {
  // Use cross-browser color-mix for dynamic branding
  return {
    primaryBg: `bg-[color:var(--brand-color,${customColor})]`,
    primaryBgHover: `hover:bg-[color:var(--brand-core,${customColor})] hover:brightness-110`,
    primaryText: `text-[color:var(--brand-color,${customColor})]`,
    secondaryText: 'text-surface-500',
    glassPanel: 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm',
    neumorphicPanel: 'bg-surface-50 shadow-[8px_8px_16px_#e5e7eb,-8px_-8px_16px_#ffffff] rounded-2xl',
    shadowStrong: 'shadow-xl shadow-black/10',
  };
};
