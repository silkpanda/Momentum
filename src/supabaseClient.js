// src/supabaseClient.js
// The new core connection file for the Momentum application.

import { createClient } from '@supabase/supabase-js';

// Get your Supabase project URL and public anon key from environment variables
// Note: These must be configured in the .env file and exposed via the Vite setup.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase client failed to initialize: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.");
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("Supabase Client Initialized for Hybrid Architecture.");