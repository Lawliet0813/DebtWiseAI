import { supabase } from './supabaseClient';
import type { Debt } from '../types/db';

export async function listDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Debt[];
}

export async function createDebt(
  input: Omit<Debt, 'id' | 'created_at' | 'updated_at'>
): Promise<Debt> {
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from('debts')
    .insert([{ ...input, created_at: timestamp, updated_at: timestamp }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create debt.');
  }

  return data as Debt;
}

export async function updateDebt(id: string, patch: Partial<Debt>): Promise<Debt> {
  const updates = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('debts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Debt not found.');
  }

  return data as Debt;
}

export async function removeDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
