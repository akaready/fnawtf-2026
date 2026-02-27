import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
      },
      colors: {
        // Purple palette based on primary color #a14dfd
        purple: {
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#dcd0ff',
          300: '#c4a8ff',
          400: '#a14dfd',
          500: '#8b3de8',
          600: '#7a2fd4',
          700: '#6622b6',
          800: '#561d94',
          900: '#471976',
        },
        // Dark theme
        background: '#000000',
        surface: '#070707',
        foreground: '#fafafa',
        muted: '#171717',
        'muted-foreground': '#a1a1aa',
        border: '#262626',
        'border-subtle': '#1f1f1f',
        accent: '#a14dfd',
        'accent-foreground': '#ffffff',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
        marker: ['var(--font-permanent-marker)', 'cursive'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(2px)' },
        },
        'dropdown-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'search-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'search-fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'search-slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'search-slide-up': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
        },
        'search-results-in': {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        'dropdown-in': 'dropdown-in 150ms ease-out',
        'search-fade-in': 'search-fade-in 120ms ease-out',
        'search-fade-out': 'search-fade-out 100ms ease-in forwards',
        'search-slide-down': 'search-slide-down 120ms ease-out',
        'search-slide-up': 'search-slide-up 100ms ease-in forwards',
        'search-results-in': 'search-results-in 120ms ease-out both',
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--foreground)',
            backgroundColor: 'var(--background)',
          },
        },
      },
    },
  },
  plugins: [require('tailwindcss/plugin')],
};

export default config;
