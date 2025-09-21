import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import defaultData from './defaultData.js';

const DEFAULT_STORAGE_PATH = process.env.DEBTWISE_DB_FILE
  ? process.env.DEBTWISE_DB_FILE
  : path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'db.json');

function clone(value) {
  return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value));
}

class FileDatabaseAdapter {
  constructor(filePath = DEFAULT_STORAGE_PATH) {
    this.filePath = filePath;
    this.ensureStorage();
    this.data = this.read();
  }

  ensureStorage() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(clone(defaultData), null, 2));
    }
  }

  read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const data = parsed && typeof parsed === 'object' ? parsed : {};
      const defaults = clone(defaultData);
      return {
        ...defaults,
        ...data,
        users: Array.isArray(data.users) ? data.users : defaults.users,
        debts: Array.isArray(data.debts) ? data.debts : defaults.debts,
        payments: Array.isArray(data.payments) ? data.payments : defaults.payments,
        reminders: Array.isArray(data.reminders) ? data.reminders : defaults.reminders,
      };
    } catch (error) {
      return clone(defaultData);
    }
  }

  write() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  async getUserById(id) {
    const user = this.data.users.find((record) => record.id === id);
    return clone(user);
  }

  async getUserByEmail(email) {
    const user = this.data.users.find((record) => record.email === email);
    return clone(user);
  }

  async createUser(user) {
    this.data.users.push(clone(user));
    this.write();
    return clone(user);
  }

  async updateUser(id, updates) {
    const index = this.data.users.findIndex((record) => record.id === id);
    if (index === -1) {
      return null;
    }
    const updated = { ...this.data.users[index], ...clone(updates) };
    this.data.users[index] = updated;
    this.write();
    return clone(updated);
  }

  async listDebtsByUser(userId) {
    return clone(this.data.debts.filter((debt) => debt.userId === userId));
  }

  async getDebtById(debtId) {
    const debt = this.data.debts.find((record) => record.id === debtId);
    return clone(debt);
  }

  async createDebt(debt) {
    this.data.debts.push(clone(debt));
    this.write();
    return clone(debt);
  }

  async updateDebt(id, updates) {
    const index = this.data.debts.findIndex((record) => record.id === id);
    if (index === -1) {
      return null;
    }
    const updated = { ...this.data.debts[index], ...clone(updates) };
    this.data.debts[index] = updated;
    this.write();
    return clone(updated);
  }

  async deleteDebt(id) {
    this.data.debts = this.data.debts.filter((record) => record.id !== id);
    this.write();
  }

  async listPaymentsByDebt(userId, debtId) {
    return clone(
      this.data.payments
        .filter((payment) => payment.userId === userId && payment.debtId === debtId)
        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
    );
  }

  async listPaymentsByUser(userId) {
    return clone(this.data.payments.filter((payment) => payment.userId === userId));
  }

  async createPayment(payment) {
    this.data.payments.push(clone(payment));
    this.write();
    return clone(payment);
  }

  async deletePaymentsByDebt(debtId) {
    this.data.payments = this.data.payments.filter((payment) => payment.debtId !== debtId);
    this.write();
  }

  async listRemindersByUser(userId) {
    return clone(
      this.data.reminders
        .filter((reminder) => reminder.userId === userId)
        .sort((a, b) => new Date(a.notifyAt) - new Date(b.notifyAt)),
    );
  }

  async createReminder(reminder) {
    this.data.reminders.push(clone(reminder));
    this.write();
    return clone(reminder);
  }
}

class SupabaseDatabaseAdapter {
  constructor(options) {
    const { url, key, schema = 'public' } = options;
    this.client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema },
    });
  }

  async getUserById(id) {
    const { data, error } = await this.client.from('users').select('*').eq('id', id).maybeSingle();
    if (error) {
      throw new Error(`Supabase getUserById failed: ${error.message}`);
    }
    return data;
  }

  async getUserByEmail(email) {
    const { data, error } = await this.client.from('users').select('*').eq('email', email).maybeSingle();
    if (error) {
      throw new Error(`Supabase getUserByEmail failed: ${error.message}`);
    }
    return data;
  }

  async createUser(user) {
    const { data, error } = await this.client.from('users').insert(user).select().single();
    if (error) {
      throw new Error(`Supabase createUser failed: ${error.message}`);
    }
    return data;
  }

  async updateUser(id, updates) {
    const { data, error } = await this.client.from('users').update(updates).eq('id', id).select().maybeSingle();
    if (error) {
      throw new Error(`Supabase updateUser failed: ${error.message}`);
    }
    return data;
  }

  async listDebtsByUser(userId) {
    const { data, error } = await this.client
      .from('debts')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: true });
    if (error) {
      throw new Error(`Supabase listDebtsByUser failed: ${error.message}`);
    }
    return data || [];
  }

  async getDebtById(debtId) {
    const { data, error } = await this.client.from('debts').select('*').eq('id', debtId).maybeSingle();
    if (error) {
      throw new Error(`Supabase getDebtById failed: ${error.message}`);
    }
    return data;
  }

  async createDebt(debt) {
    const { data, error } = await this.client.from('debts').insert(debt).select().single();
    if (error) {
      throw new Error(`Supabase createDebt failed: ${error.message}`);
    }
    return data;
  }

  async updateDebt(id, updates) {
    const { data, error } = await this.client.from('debts').update(updates).eq('id', id).select().maybeSingle();
    if (error) {
      throw new Error(`Supabase updateDebt failed: ${error.message}`);
    }
    return data;
  }

  async deleteDebt(id) {
    const { error } = await this.client.from('debts').delete().eq('id', id);
    if (error) {
      throw new Error(`Supabase deleteDebt failed: ${error.message}`);
    }
  }

  async listPaymentsByDebt(userId, debtId) {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .eq('userId', userId)
      .eq('debtId', debtId)
      .order('paidAt', { ascending: false });
    if (error) {
      throw new Error(`Supabase listPaymentsByDebt failed: ${error.message}`);
    }
    return data || [];
  }

  async listPaymentsByUser(userId) {
    const { data, error } = await this.client.from('payments').select('*').eq('userId', userId);
    if (error) {
      throw new Error(`Supabase listPaymentsByUser failed: ${error.message}`);
    }
    return data || [];
  }

  async createPayment(payment) {
    const { data, error } = await this.client.from('payments').insert(payment).select().single();
    if (error) {
      throw new Error(`Supabase createPayment failed: ${error.message}`);
    }
    return data;
  }

  async deletePaymentsByDebt(debtId) {
    const { error } = await this.client.from('payments').delete().eq('debtId', debtId);
    if (error) {
      throw new Error(`Supabase deletePaymentsByDebt failed: ${error.message}`);
    }
  }

  async listRemindersByUser(userId) {
    const { data, error } = await this.client
      .from('reminders')
      .select('*')
      .eq('userId', userId)
      .order('notifyAt', { ascending: true });
    if (error) {
      throw new Error(`Supabase listRemindersByUser failed: ${error.message}`);
    }
    return data || [];
  }

  async createReminder(reminder) {
    const { data, error } = await this.client.from('reminders').insert(reminder).select().single();
    if (error) {
      throw new Error(`Supabase createReminder failed: ${error.message}`);
    }
    return data;
  }
}

class Database {
  constructor(config = {}, filePath = DEFAULT_STORAGE_PATH) {
    const supabaseUrl = config.supabase?.url || process.env.SUPABASE_URL;
    const supabaseKey =
      config.supabase?.serviceRoleKey ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      config.supabase?.anonKey ||
      process.env.SUPABASE_ANON_KEY;
    const schema = config.supabase?.schema || process.env.SUPABASE_SCHEMA || 'public';

    if (supabaseUrl && supabaseKey) {
      this.kind = 'supabase';
      this.adapter = new SupabaseDatabaseAdapter({ url: supabaseUrl, key: supabaseKey, schema });
    } else {
      this.kind = 'file';
      this.adapter = new FileDatabaseAdapter(filePath);
    }
  }

  get isSupabase() {
    return this.kind === 'supabase';
  }

  async getUserById(id) {
    return this.adapter.getUserById(id);
  }

  async getUserByEmail(email) {
    return this.adapter.getUserByEmail(email);
  }

  async createUser(user) {
    return this.adapter.createUser(user);
  }

  async updateUser(id, updates) {
    return this.adapter.updateUser(id, updates);
  }

  async listDebtsByUser(userId) {
    return this.adapter.listDebtsByUser(userId);
  }

  async getDebtById(debtId) {
    return this.adapter.getDebtById(debtId);
  }

  async createDebt(debt) {
    return this.adapter.createDebt(debt);
  }

  async updateDebt(id, updates) {
    return this.adapter.updateDebt(id, updates);
  }

  async deleteDebt(id) {
    return this.adapter.deleteDebt(id);
  }

  async listPaymentsByDebt(userId, debtId) {
    return this.adapter.listPaymentsByDebt(userId, debtId);
  }

  async listPaymentsByUser(userId) {
    return this.adapter.listPaymentsByUser(userId);
  }

  async createPayment(payment) {
    return this.adapter.createPayment(payment);
  }

  async deletePaymentsByDebt(debtId) {
    return this.adapter.deletePaymentsByDebt(debtId);
  }

  async listRemindersByUser(userId) {
    return this.adapter.listRemindersByUser(userId);
  }

  async createReminder(reminder) {
    return this.adapter.createReminder(reminder);
  }
}

export default Database;
