import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function ensureEnvVar(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing Supabase configuration: ${name}`);
  }
  return value;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const supabaseUrl = ensureEnvVar(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
    const supabaseAnonKey = ensureEnvVar(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY');
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

export const supabaseBrowserClient = getSupabaseBrowserClient();
ㄎ
