/**
 * Data access layer for Supabase Postgres.
 *
 * This module centralizes table/view typings and CRUD helpers used across the app.
 */
import type { User } from '@supabase/supabase-js';
import supabase from './supabaseClient';

export type MembershipType = 'free' | 'premium';
export type DebtType =
  | 'credit_card'
  | 'auto_loan'
  | 'student_loan'
  | 'mortgage'
  | 'personal_loan'
  | 'medical_debt'
  | 'other';
export type DebtStatus = 'active' | 'paid_off' | 'closed';
export type PaymentType = 'regular' | 'extra' | 'minimum' | 'final';
export type ReminderType = 'due_date' | 'custom' | 'milestone' | 'strategy';
export type StrategyType = 'snowball' | 'avalanche';

export interface UserProfile {
  id: string;
  full_name?: string | null;
  membership_type: MembershipType;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  balance: string;
  original_amount: string;
  interest_rate: string;
  minimum_payment: string;
  due_date: string | null;
  debt_type: DebtType;
  status: DebtStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  debt_id: string;
  amount: string;
  payment_date: string;
  payment_type: PaymentType;
  notes: string | null;
  created_at: string;
}

export interface VDebtProgress {
  debt_id: string;
  total_paid: string;
  paid_percent: string;
  remaining_balance?: string | null;
  last_payment_date?: string | null;
}

export interface CreateDebtPayload {
  name: string;
  balance: number;
  original_amount: number;
  interest_rate: number;
  minimum_payment: number;
  due_date?: string | null;
  debt_type: DebtType;
  status?: DebtStatus;
  notes?: string | null;
}

export interface UpdateDebtPayload {
  id: string;
  name?: string;
  balance?: number;
  original_amount?: number;
  interest_rate?: number;
  minimum_payment?: number;
  due_date?: string | null;
  debt_type?: DebtType;
  status?: DebtStatus;
  notes?: string | null;
}

export interface AddPaymentPayload {
  debt_id: string;
  amount: number;
  payment_date: string;
  payment_type: PaymentType;
  notes?: string | null;
}

const handleError = (context: string, error: { message: string } | null) => {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
};

const requireAuthUser = async (): Promise<User> => {
  const { data, error } = await supabase.auth.getUser();
  handleError('Failed to load authenticated user', error);

  if (!data?.user) {
    throw new Error('No authenticated user is available.');
  }

  return data.user;
};

export const upsertMyProfile = async (): Promise<UserProfile> => {
  const user = await requireAuthUser();

  const profilePayload = {
    id: user.id,
    full_name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' })
    .select()
    .single();

  handleError('Failed to upsert user profile', error);

  if (!data) {
    throw new Error('No profile data returned after upsert.');
  }

  return data as UserProfile;
};

export const listDebts = async (): Promise<Debt[]> => {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false });

  handleError('Failed to load debts', error);

  return (data ?? []) as Debt[];
};

export const listDebtProgress = async (): Promise<VDebtProgress[]> => {
  const { data, error } = await supabase
    .from('v_debt_progress')
    .select('*')
    .order('debt_id', { ascending: true });

  handleError('Failed to load debt progress', error);

  return (data ?? []) as VDebtProgress[];
};

export const createDebt = async (payload: CreateDebtPayload): Promise<Debt> => {
  const user = await requireAuthUser();

  const { data, error } = await supabase
    .from('debts')
    .insert({
      user_id: user.id,
      name: payload.name,
      balance: payload.balance,
      original_amount: payload.original_amount,
      interest_rate: payload.interest_rate,
      minimum_payment: payload.minimum_payment,
      due_date: payload.due_date ?? null,
      debt_type: payload.debt_type,
      status: payload.status ?? 'active',
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  handleError('Failed to create debt', error);

  if (!data) {
    throw new Error('No debt returned after creation.');
  }

  return data as Debt;
};

export const updateDebt = async (payload: UpdateDebtPayload): Promise<Debt> => {
  const updates: Record<string, unknown> = {};

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.balance !== undefined) updates.balance = payload.balance;
  if (payload.original_amount !== undefined)
    updates.original_amount = payload.original_amount;
  if (payload.interest_rate !== undefined)
    updates.interest_rate = payload.interest_rate;
  if (payload.minimum_payment !== undefined)
    updates.minimum_payment = payload.minimum_payment;
  if (payload.due_date !== undefined) updates.due_date = payload.due_date;
  if (payload.debt_type !== undefined) updates.debt_type = payload.debt_type;
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.notes !== undefined) updates.notes = payload.notes;

  const { data, error } = await supabase
    .from('debts')
    .update(updates)
    .eq('id', payload.id)
    .select()
    .single();

  handleError('Failed to update debt', error);

  if (!data) {
    throw new Error('No debt returned after update.');
  }

  return data as Debt;
};

export const removeDebt = async (debtId: string): Promise<void> => {
  const { error } = await supabase.from('debts').delete().eq('id', debtId);
  handleError('Failed to delete debt', error);
};

export const listPayments = async (debtId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('debt_id', debtId)
    .order('payment_date', { ascending: false });

  handleError('Failed to load payments', error);

  return (data ?? []) as Payment[];
};

export const addPayment = async (payload: AddPaymentPayload): Promise<Payment> => {
  const user = await requireAuthUser();

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      debt_id: payload.debt_id,
      amount: payload.amount,
      payment_date: payload.payment_date,
      payment_type: payload.payment_type,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  handleError('Failed to add payment', error);

  if (!data) {
    throw new Error('No payment returned after creation.');
  }

  return data as Payment;
};
