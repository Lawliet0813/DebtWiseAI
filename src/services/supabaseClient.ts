import { createClient } from '@supabase/supabase-js';

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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') ?? getEnvVar('SUPABASE_URL');
const supabaseAnonKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ?? getEnvVar('SUPABASE_ANON_KEY');

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
