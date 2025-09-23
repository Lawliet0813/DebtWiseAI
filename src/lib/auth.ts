import type { AuthResponse } from '@supabase/supabase-js';

import supabaseClient from './supabaseClient';

export interface SignUpWithProfileParams {
  email: string;
  password: string;
  fullName?: string;
}

const emailRedirectTo =
  typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

export async function signUpWithProfile({
  email,
  password,
  fullName,
}: SignUpWithProfileParams): Promise<AuthResponse['data']> {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { full_name: fullName ?? '' },
    },
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert(
        { id: data.user.id, full_name: fullName ?? '' },
        { onConflict: 'id' },
      );

    if (profileError) {
      throw profileError;
    }
  }

  return data;
}

export async function signInUser(email: string, password: string): Promise<AuthResponse['data']> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export const supabase = supabaseClient;

export default supabase;
