// vite.config.js (UPDATED)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// --- THIS IS THE FIX (Step 1) ---
// Import the Tailwind plugin
import tailwindcss from '@tailwindcss/vite'
// --------------------------------

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // --- THIS IS THE FIX (Step 2) ---
    // Add the plugin to the array
    tailwindcss(),
    // --------------------------------
  ],
})