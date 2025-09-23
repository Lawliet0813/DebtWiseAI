import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient, MOCK_SUPABASE_NOTICE } from './mockSupabaseClient';

type EnvSource = Record<string, string | undefined>;

const importMetaEnv =
  typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined'
    ? (import.meta.env as EnvSource)
    : undefined;

const processEnv =
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as { process?: { env?: EnvSource } }).process?.env !== 'undefined'
    ? ((globalThis as { process?: { env?: EnvSource } }).process?.env as EnvSource)
    : undefined;

const envSources = [importMetaEnv, processEnv].filter(Boolean) as EnvSource[];

const getEnvVar = (key: string) => {
  for (const source of envSources) {
    const value = source[key];
    if (value) {
      return value;
    }
  }
  return undefined;
};

const useMockSupabase = getEnvVar('VITE_SUPABASE_USE_MOCK') === 'true';

let supabaseClient: Pick<SupabaseClient, 'auth' | 'from'>;

if (useMockSupabase) {
  console.info('[supabaseClient] 使用 Mock Supabase Client。');
  console.info(`[supabaseClient] ${MOCK_SUPABASE_NOTICE}`);
  supabaseClient = createMockSupabaseClient();
} else {
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable.');
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable.');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = supabaseClient;
export const isSupabaseMocked = useMockSupabase;
