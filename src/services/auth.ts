import type { AuthError, AuthResponse, Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export const signInWithOtp = async (email: string): Promise<AuthResponse> =>
  supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });

export const signInWithPassword = async (
  email: string,
  password: string
): Promise<AuthResponse> =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getCurrentSession = (): Promise<{ data: { session: Session | null }; error: AuthError | null }> =>
  supabase.auth.getSession();

export const getCurrentUser = (): Promise<{ data: { user: User | null }; error: AuthError | null }> =>
  supabase.auth.getUser();

export const onAuthStateChange = (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
  supabase.auth.onAuthStateChange(callback);
