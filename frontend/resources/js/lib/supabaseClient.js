// frontend/resources/js/lib/supabaseClient.js
/**
 * Frontend Supabase Client Singleton.
 * Uses Vite environment variables with hardcoded safe defaults pointing to the
 * project anon key. Persists JWT sessions securely in localStorage.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://zmhncazedwvyuxrzucwv.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptaG5jYXplZHd2eXV4cnp1Y3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NDcyNDQsImV4cCI6MjEwODIyMzI0NH0.g-o9jeI4Ym9goe09Ong36Zkx5nTdozcWwmHXQ49e-FM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

