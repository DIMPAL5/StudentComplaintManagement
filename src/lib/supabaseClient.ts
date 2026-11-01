import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.info('⚡ [Smart Campus 360] Supabase backend connected successfully.');
  } catch (err) {
    console.warn('⚠️ [Smart Campus 360] Failed to initialize Supabase client:', err);
    supabase = null;
  }
} else {
  console.info(
    'ℹ️ [Smart Campus 360] Running in Local Demonstration Mode (localStorage persistence). Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect a live Supabase PostgreSQL backend.'
  );
}
