import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Strictly read credentials from backend environment variables - NO HARDCODED SECRETS
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

let serverSupabaseClient: SupabaseClient | null = null;

export function getBackendSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!serverSupabaseClient) {
    try {
      serverSupabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Failed to initialize server-side Supabase client:', err);
      return null;
    }
  }

  return serverSupabaseClient;
}

export function isSupabaseBackendConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getSupabasePublicUrl(): string {
  return supabaseUrl;
}
