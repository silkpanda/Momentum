// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all our React components
  ],
  theme: {
    extend: {
      // --- 1. Typography ---
      // Here we teach Tailwind to use our --font-primary variable
      // whenever it sees the 'font-primary' class.
      fontFamily: {
        primary: ['var(--font-primary)'],
      },
      // We also teach it our custom text sizes.
      fontSize: {
        '2xl': 'var(--text-2xl)',
        'lg': 'var(--text-lg)',
        'base': 'var(--text-base)',
        'sm': 'var(--text-sm)',
        'xs': 'var(--text-xs)',
      },

      // --- 2. Colors ---
      // This is the big one. We're mapping all our CSS variables
      // to Tailwind color names.
      colors: {
        // Semantic Roles (Signal)
        'bg-canvas': 'var(--color-bg-canvas)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-muted': 'var(--color-bg-muted)',
        
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-disabled': 'var(--color-text-disabled)',
        'text-inverted': 'var(--color-text-inverted)',

        'border-primary': 'var(--color-border-primary)',
        'border-muted': 'var(--color-border-muted)',

        // Action & State (Spark)
        'action-primary': 'var(--color-action-primary)',
        'action-primary-hover': 'var(--color-action-primary-hover)',
        'text-on-action': 'var(--color-text-on-action)',
        
        'signal-success': 'var(--color-signal-success)',
        'signal-warning': 'var(--color-signal-warning)',
        'signal-danger': 'var(--color-signal-danger)',

        // Accent Palette (User-controlled)
        'accent-forest': 'var(--palette-accent-forest)',
        'accent-ruby': 'var(--palette-accent-ruby)',
        'accent-aqua': 'var(--palette-accent-aqua)',

        // Base Palette (for convenience, if needed)
        'palette-gray-0': 'var(--palette-gray-0)',
        'palette-gray-50': 'var(--palette-gray-50)',
        'palette-gray-100': 'var(--palette-gray-100)',
        'palette-gray-300': 'var(--palette-gray-300)',
        'palette-gray-500': 'var(--palette-gray-500)',
        'palette-gray-700': 'var(--palette-gray-700)',
        'palette-gray-900': 'var(--palette-gray-900)',
        'palette-black': 'var(--palette-black)',
      },
    },
  },
  plugins: [],
}