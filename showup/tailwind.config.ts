import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--color-accent-soft) / <alpha-value>)',
        page: 'rgb(var(--color-page) / <alpha-value>)',
        'page-soft': 'rgb(var(--color-page-soft) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-soft': 'rgb(var(--color-secondary-soft) / <alpha-value>)',
        tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
        'tertiary-soft': 'rgb(var(--color-tertiary-soft) / <alpha-value>)',
        ruby: 'rgb(var(--color-ruby) / <alpha-value>)',
        'ruby-soft': 'rgb(var(--color-ruby-soft) / <alpha-value>)',
        amber: 'rgb(var(--color-amber) / <alpha-value>)',
        'amber-soft': 'rgb(var(--color-amber-soft) / <alpha-value>)',
        fuchsia: 'rgb(var(--color-fuchsia) / <alpha-value>)',
        'fuchsia-soft': 'rgb(var(--color-fuchsia-soft) / <alpha-value>)',
        good: 'rgb(var(--color-good) / <alpha-value>)',
        warn: 'rgb(var(--color-warn) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
        chart: {
          1: 'rgb(var(--color-chart-1) / <alpha-value>)',
          2: 'rgb(var(--color-chart-2) / <alpha-value>)',
          3: 'rgb(var(--color-chart-3) / <alpha-value>)',
          4: 'rgb(var(--color-chart-4) / <alpha-value>)',
          5: 'rgb(var(--color-chart-5) / <alpha-value>)',
        },
      },
      borderRadius: {
        xl2: '1.25rem',
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
        pop: '0 8px 32px rgba(15, 23, 42, 0.12)',
        'glow-accent': '0 4px 24px -4px rgb(var(--color-accent) / 0.45)',
        'glow-page': '0 4px 24px -4px rgb(var(--color-page) / 0.48)',
        'glow-secondary': '0 4px 24px -4px rgb(var(--color-secondary) / 0.45)',
        'glow-tertiary': '0 4px 24px -4px rgb(var(--color-tertiary) / 0.45)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'sheet-up': 'sheet-up 240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
