import { supabase } from './supabaseClient';
import type { Payment } from '../types/db';

export async function listPayments(debtId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('debt_id', debtId)
    .order('payment_date', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Payment[];
}

export async function addPayment(
  payment: Omit<Payment, 'id' | 'created_at'>
): Promise<Payment> {
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from('payments')
    .insert([{ ...payment, created_at: timestamp }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create payment.');
  }

  return data as Payment;
}
