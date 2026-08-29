/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#E2D1C2',
          100: '#E2D1C2',
          200: '#D4BBAC',
          300: '#D4BBAC',
          400: '#98755B',
          500: '#98755B',
          600: '#98755B',
          700: '#5C3422',
          800: '#442913',
          900: '#442913',
        },
        aura: {
          ink: 'var(--aura-ink)',
          bark: 'var(--aura-bark)',
          umber: 'var(--aura-umber)',
          clay: 'var(--aura-clay)',
          sand: 'var(--aura-sand)',
          cream: 'var(--aura-cream)',
          paper: 'var(--aura-paper)',
          ivory: 'var(--aura-ivory)',
        },

        /* ---- Semantic tokens (preferred for new + migrated code) ----
           Role-based names that resolve per theme via styles/tokens.css.
           Use these instead of aura-* or raw Tailwind colour families. */
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          raised: 'var(--bg-surface-raised)',
          sunken: 'var(--bg-surface-sunken)',
        },
        overlay: 'var(--bg-overlay)',
        content: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          emphasis: 'var(--text-emphasis)',
          inverse: 'var(--text-inverse)',
          disabled: 'var(--state-disabled-text)',
          'on-accent': 'var(--text-on-accent)',
        },
        edge: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
          focus: 'var(--border-focus)',
        },
        accent: {
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          400: 'var(--accent-400)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          900: 'var(--accent-900)',
          DEFAULT: 'var(--accent-600)',
        },
        success: {
          DEFAULT: 'var(--status-success)',
          bg: 'var(--status-success-bg)',
          border: 'var(--status-success-border)',
        },
        warning: {
          DEFAULT: 'var(--status-warning)',
          bg: 'var(--status-warning-bg)',
          border: 'var(--status-warning-border)',
        },
        danger: {
          DEFAULT: 'var(--status-error)',
          bg: 'var(--status-error-bg)',
          border: 'var(--status-error-border)',
        },
        info: {
          DEFAULT: 'var(--status-info)',
          bg: 'var(--status-info-bg)',
          border: 'var(--status-info-border)',
        },
      },
      /* Radius is intentionally NOT overridden here. Tailwind's default
         rounded-sm/md/lg are used throughout the app; remapping them would
         silently restyle every existing component. Radius tokens are revisited
         in Phase 2 under a distinct name. */
      boxShadow: {
        'elev-1': 'var(--elev-1)',
        'elev-2': 'var(--elev-2)',
        'elev-3': 'var(--elev-3)',
        focus: 'var(--state-focus-ring)',
      },
      fontFamily: {
        sans: ['Jost', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
