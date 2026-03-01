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
        // Dark theme (legacy — kept for public site compatibility)
        background: '#000000',
        surface: '#070707',
        foreground: '#fafafa',
        muted: '#171717',
        'muted-foreground': '#a1a1aa',
        border: '#262626',
        'border-subtle': '#1f1f1f',
        accent: '#a14dfd',
        'accent-foreground': '#ffffff',

        // ─── Admin Design Tokens ───────────────────────────────────
        admin: {
          bg: {
            base:           'var(--admin-bg-base)',
            inset:          'var(--admin-bg-inset)',
            sidebar:        'var(--admin-bg-sidebar)',
            'sidebar-hover': 'var(--admin-bg-sidebar-hover)',
            raised:         'var(--admin-bg-raised)',
            overlay:        'var(--admin-bg-overlay)',
            wash:           'var(--admin-bg-wash)',
            subtle:         'var(--admin-bg-subtle)',
            selected:       'var(--admin-bg-selected)',
            hover:          'var(--admin-bg-hover)',
            'hover-strong': 'var(--admin-bg-hover-strong)',
            active:         'var(--admin-bg-active)',
          },
          border: {
            subtle:    'var(--admin-border-subtle)',
            DEFAULT:   'var(--admin-border)',
            muted:     'var(--admin-border-muted)',
            emphasis:  'var(--admin-border-emphasis)',
            focus:     'var(--admin-border-focus)',
          },
          text: {
            primary:     'var(--admin-text-primary)',
            secondary:   'var(--admin-text-secondary)',
            muted:       'var(--admin-text-muted)',
            dim:         'var(--admin-text-dim)',
            faint:       'var(--admin-text-faint)',
            ghost:       'var(--admin-text-ghost)',
            placeholder: 'var(--admin-text-placeholder)',
          },
          danger: {
            DEFAULT:     'var(--admin-danger)',
            bg:          'var(--admin-danger-bg)',
            'bg-strong': 'var(--admin-danger-bg-strong)',
            border:      'var(--admin-danger-border)',
          },
          success: {
            DEFAULT:     'var(--admin-success)',
            bg:          'var(--admin-success-bg)',
            'bg-strong': 'var(--admin-success-bg-strong)',
            border:      'var(--admin-success-border)',
          },
          warning: {
            DEFAULT:     'var(--admin-warning)',
            bg:          'var(--admin-warning-bg)',
            'bg-strong': 'var(--admin-warning-bg-strong)',
            border:      'var(--admin-warning-border)',
          },
          info: {
            DEFAULT:     'var(--admin-info)',
            bg:          'var(--admin-info-bg)',
            'bg-strong': 'var(--admin-info-bg-strong)',
            border:      'var(--admin-info-border)',
          },
          accent: {
            DEFAULT:     'var(--admin-accent)',
            hover:       'var(--admin-accent-hover)',
            bg:          'var(--admin-accent-bg)',
            border:      'var(--admin-accent-border)',
          },
          toolbar: {
            red:    'var(--admin-toolbar-red)',
            orange: 'var(--admin-toolbar-orange)',
            yellow: 'var(--admin-toolbar-yellow)',
            green:  'var(--admin-toolbar-green)',
            blue:   'var(--admin-toolbar-blue)',
            indigo: 'var(--admin-toolbar-indigo)',
            violet: 'var(--admin-toolbar-violet)',
          },
        },
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
        marker: ['var(--font-permanent-marker)', 'cursive'],
        // Admin typography tokens
        'admin-display': ['var(--admin-font-display)'],
        'admin-body':    ['var(--admin-font-body)'],
        'admin-mono':    ['var(--admin-font-mono)'],
      },
      fontSize: {
        'admin-xs':  'var(--admin-font-size-xs)',
        'admin-sm':  'var(--admin-font-size-sm)',
        'admin-base': 'var(--admin-font-size-base)',
        'admin-lg':  'var(--admin-font-size-lg)',
        'admin-xl':  'var(--admin-font-size-xl)',
        'admin-2xl': 'var(--admin-font-size-2xl)',
      },
      borderRadius: {
        'admin-sm':   'var(--admin-radius-sm)',
        'admin-md':   'var(--admin-radius-md)',
        'admin-lg':   'var(--admin-radius-lg)',
        'admin-xl':   'var(--admin-radius-xl)',
        'admin-full': 'var(--admin-radius-full)',
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
  plugins: [
    require('tailwindcss/plugin'),
    require('@tailwindcss/container-queries'),
  ],
};

export default config;
