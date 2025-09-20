import { supabase } from './supabaseClient';
import type { Reminder } from '../types/db';

export async function listMyReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .order('reminder_date', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Reminder[];
}

export async function createReminder(
  reminder: Omit<Reminder, 'id' | 'created_at' | 'is_completed'>
): Promise<Reminder> {
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from('reminders')
    .insert([{ ...reminder, is_completed: false, created_at: timestamp }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create reminder.');
  }

  return data as Reminder;
}
