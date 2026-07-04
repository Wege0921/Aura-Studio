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
      },
      fontFamily: {
        sans: ['Jost', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
