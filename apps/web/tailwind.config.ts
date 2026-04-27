import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand-color-rgb) / <alpha-value>)',
        },
        'brand-secondary': {
          DEFAULT: 'rgb(var(--brand-color-secondary-rgb) / <alpha-value>)',
        },
        primary: {
          50: '#f4f7f6',
          100: '#e3ebe8',
          200: '#c6d6d0',
          300: '#a0bdb4',
          400: '#739d91',
          500: '#4d8073',
          600: '#3b665b',
          700: '#31524a',
          800: '#2a433d',
          900: '#243833',
          950: '#13201d',
        },
        accent: {
          50: '#fdfcf8',
          100: '#fbf7ed',
          200: '#f5ead2',
          300: '#eed8ad',
          400: '#e4c17f',
          500: '#d9a751',
          600: '#c68a3a',
          700: '#a56c32',
          800: '#85582e',
          900: '#6c4929',
          950: '#3d2613',
        },
        surface: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
      },
      fontFamily: {
        sans: ['Calibri', '"Carlito"', 'system-ui', 'sans-serif'],
        display: ['Calibri', '"Carlito"', '"Playfair Display"', 'Georgia', 'serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        montserrat: ['Montserrat', 'system-ui', 'sans-serif'],
        merriweather: ['Merriweather', 'Georgia', 'serif'],
        roboto: ['Roboto', 'system-ui', 'sans-serif'],
        'open-sans': ['"Open Sans"', 'system-ui', 'sans-serif'],
        lato: ['Lato', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
