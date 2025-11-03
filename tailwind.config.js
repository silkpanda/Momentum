// tailwind.config.js (FIXED: Added 'base-content' color)

import daisyui from 'daisyui';
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  safelist: [
    'auth-blue',
    'auth-purple',
    'managed-green',
    'managed-orange',
    'managed-red',
    'managed-teal',
    'managed-purple',
    'managed-blue',
  ],

  theme: {
    extend: {},
  },
  
  plugins: [
    daisyui,
    
    plugin(function({ addUtilities }) {
      addUtilities({
        '.auth-blue': {
          'background-color': '#3b82f6', // bg-blue-500
          'color': '#ffffff', // text-white
        },
        '.auth-purple': {
          'background-color': '#8b5cf6', // bg-violet-500
          'color': '#ffffff',
        },
        '.managed-green': {
          'background-color': '#22c55e', // bg-green-500
          'color': '#ffffff',
        },
        '.managed-orange': {
          'background-color': '#f97316', // bg-orange-500
          'color': '#ffffff',
        },
        '.managed-red': {
          'background-color': '#ef4444', // bg-red-500
          'color': '#ffffff',
        },
        '.managed-teal': {
          'background-color': '#14b8a6', // bg-teal-500
          'color': '#ffffff',
        },
        '.managed-purple': {
          'background-color': '#a855f7', // bg-purple-500
          'color': '#ffffff',
        },
        '.managed-blue': {
          'background-color': '#0ea5e9', // bg-sky-500
          'color': '#ffffff',
        },
      })
    })
  ],
  
  // DaisyUI theme configuration
  daisyui: {
    themes: [
      {
        momentum: {
          "primary": "#661AE6",
          "secondary": "#D926AA",
          "accent": "#1FB2A5",
          "neutral": "#191D24",
          "base-100": "#2A303C",
          // 🛠️ FIX: Added 'base-content' to define the default text color
          // on 'base-100' as white.
          "base-content": "#ffffff", 
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        },
      },
    ],
  },
};