/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // CRITICAL FIX: Map semantic role names to custom CSS properties
      colors: {
        'bg-canvas': 'var(--color-bg-canvas)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        
        'action-primary': 'var(--color-action-primary)',
        'action-primary-hover': 'var(--color-action-primary-hover)',
        'action-primary-inverted': 'var(--color-action-primary-inverted)',
        
        'signal-error': 'var(--color-signal-error)',
        'signal-error-bg': 'var(--color-signal-error-bg)',
        'signal-success': 'var(--color-signal-success)',
        'signal-success-bg': 'var(--color-signal-success-bg)',

        'border-primary': 'var(--color-border-primary)',
      },
    },
  },
  plugins: [],
}