// tailwind.config.js (UPDATED)

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // This scans all our components
  ],

  // --- THIS IS THE FIX ---
  // We must "safelist" the dynamic color classes used in EditProfileModal
  // so Tailwind doesn't purge them.
  safelist: [
    'bg-managed-blue',
    'bg-managed-green',
    'bg-managed-yellow',
    'bg-managed-purple',
    'bg-managed-orange',
    'bg-managed-teal',
    'bg-managed-pink',
    'bg-managed-indigo',
    'ring-managed-blue',
    'ring-managed-green',
    'ring-managed-yellow',
    'ring-managed-purple',
    'ring-managed-orange',
    'ring-managed-teal',
    'ring-managed-pink',
    'ring-managed-indigo',
  ],
  // --- END FIX ---
  
  theme: {
    extend: {
      // Define our custom colors based on the theme variables
      colors: {
        'bg-canvas': 'var(--color-bg-canvas)',
        'bg-surface-1': 'var(--color-bg-surface-1)',
        'bg-surface-2': 'var(--color-bg-surface-2)',
        'bg-surface-hover': 'var(--color-bg-surface-hover)',
        'bg-overlay': 'var(--color-bg-overlay)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-on-primary': 'var(--color-text-on-primary)',
        'border-default': 'var(--color-border-default)',
        'action-primary': 'var(--color-action-primary)',
        'action-primary-hover': 'var(--color-action-primary-hover)',
        'signal-error': 'var(--color-signal-error)',
        'signal-success': 'var(--color-signal-success)',
        'signal-warning': 'var(--color-signal-warning)',
        
        // Profile Colors from Style Guide
        'managed-blue': 'var(--color-managed-blue)',
        'managed-green': 'var(--color-managed-green)',
        'managed-yellow': 'var(--color-managed-yellow)',
        'managed-purple': 'var(--color-managed-purple)',
        'managed-orange': 'var(--color-managed-orange)',
        'managed-teal': 'var(--color-managed-teal)',
        'managed-pink': 'var(--color-managed-pink)',
        'managed-indigo': 'var(--color-managed-indigo)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};