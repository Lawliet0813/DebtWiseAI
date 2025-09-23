import type {
  AuthChangeEvent,
  AuthResponse,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import type { Debt, Payment, Reminder, UserProfile } from '../types/db';

type MockUser = UserProfile & { email: string; password: string };

type MockData = {
  users: MockUser[];
  debts: Debt[];
  payments: Payment[];
  reminders: Reminder[];
};

type TableName = keyof MockData;

type FilterCondition = {
  column: string;
  value: unknown;
};

type OrderConfig = {
  column: string;
  ascending: boolean;
};

type OperationType = 'select' | 'insert' | 'update' | 'delete';

interface OperationState {
  type: OperationType;
  returning: boolean;
  filters: FilterCondition[];
  order?: OrderConfig;
  payload?: unknown;
  single?: 'single' | 'maybe';
}

interface PostgrestLikeResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

const STORAGE_KEY = 'debtwise_mock_supabase_v1';
const SESSION_KEY = 'debtwise_mock_supabase_session_v1';

const now = new Date().toISOString();
const defaultUserId = 'mock-user-1';

const defaultData: MockData = {
  users: [
    {
      id: defaultUserId,
      email: 'demo@debtwise.ai',
      full_name: 'DebtWise Demo',
      membership_type: 'premium',
      created_at: now,
      updated_at: now,
      password: 'demo1234',
    },
  ],
  debts: [
    {
      id: 'mock-debt-1',
      user_id: defaultUserId,
      name: '昇陽銀行信用卡',
      balance: 42000,
      original_amount: 60000,
      interest_rate: 15.2,
      minimum_payment: 3200,
      due_date: new Date('2024-07-25T00:00:00.000Z').toISOString(),
      debt_type: 'credit_card',
      status: 'active',
      notes: '此為離線模式的示範資料。',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mock-debt-2',
      user_id: defaultUserId,
      name: '家用整合貸款',
      balance: 198000,
      original_amount: 250000,
      interest_rate: 9.5,
      minimum_payment: 7500,
      due_date: new Date('2024-07-18T00:00:00.000Z').toISOString(),
      debt_type: 'personal_loan',
      status: 'active',
      notes: '用於家庭裝修的貸款。',
      created_at: now,
      updated_at: now,
    },
  ],
  payments: [
    {
      id: 'mock-payment-1',
      debt_id: 'mock-debt-1',
      amount: 3200,
      payment_date: new Date('2024-05-10T12:00:00.000Z').toISOString(),
      payment_type: 'regular',
      notes: '例行繳款。',
      created_at: now,
    },
    {
      id: 'mock-payment-2',
      debt_id: 'mock-debt-2',
      amount: 7500,
      payment_date: new Date('2024-05-05T09:30:00.000Z').toISOString(),
      payment_type: 'regular',
      notes: '貸款分期付款。',
      created_at: now,
    },
  ],
  reminders: [
    {
      id: 'mock-reminder-1',
      user_id: defaultUserId,
      debt_id: 'mock-debt-1',
      title: '信用卡繳費提醒',
      message: '記得於 7/25 前繳納最低還款。',
      reminder_type: 'due_date',
      reminder_date: new Date('2024-07-22T01:00:00.000Z').toISOString(),
      is_completed: false,
      created_at: now,
    },
  ],
};

const memoryStore: { value: MockData } = { value: clone(defaultData) };
let memorySession: Session | null = null;

function getLocalStorage(): Storage | null {
  if (typeof window !== 'undefined' && window?.localStorage) {
    return window.localStorage;
  }
  return null;
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeWithDefaults(raw: unknown): MockData {
  const fallback: MockData = {
    users: [],
    debts: [],
    payments: [],
    reminders: [],
  };

  if (!raw || typeof raw !== 'object') {
    return clone(defaultData);
  }

  const parsed = raw as Partial<MockData>;
  return {
    users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users.map(clone) : clone(defaultData.users),
    debts: Array.isArray(parsed.debts) ? parsed.debts.map(clone) : clone(fallback.debts),
    payments: Array.isArray(parsed.payments) ? parsed.payments.map(clone) : clone(fallback.payments),
    reminders: Array.isArray(parsed.reminders) ? parsed.reminders.map(clone) : clone(fallback.reminders),
  };
}

function readData(): MockData {
  const storage = getLocalStorage();

  if (!storage) {
    return clone(memoryStore.value);
  }

  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    storage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    memoryStore.value = clone(defaultData);
    return clone(defaultData);
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const data = mergeWithDefaults(parsed);
    memoryStore.value = clone(data);
    return clone(data);
  } catch (error) {
    console.warn('[mockSupabase] 無法解析儲存的資料，將重新初始化。', error);
    storage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    memoryStore.value = clone(defaultData);
    return clone(defaultData);
  }
}

function writeData(data: MockData) {
  memoryStore.value = clone(data);
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function readSession(): Session | null {
  const storage = getLocalStorage();
  if (!storage) {
    return memorySession ? clone(memorySession) : null;
  }

  const raw = storage.getItem(SESSION_KEY);
  if (!raw) {
    memorySession = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Session;
    memorySession = clone(parsed);
    return clone(parsed);
  } catch (error) {
    console.warn('[mockSupabase] 無法解析登入工作階段資料，將重新初始化。', error);
    storage.removeItem(SESSION_KEY);
    memorySession = null;
    return null;
  }
}

function writeSession(session: Session | null) {
  memorySession = session ? clone(session) : null;
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  if (!session) {
    storage.removeItem(SESSION_KEY);
    return;
  }

  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createAuthError(message: string): { message: string; status: number; name: string } {
  return {
    message,
    status: 400,
    name: 'AuthApiError',
  };
}

function createNotFoundError(table: TableName): { message: string; code: string } {
  return {
    message: `No rows returned for table ${table}.`,
    code: 'PGRST116',
  };
}

function toAuthUser(user: MockUser) {
  return {
    id: user.id,
    email: user.email,
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: user.full_name, name: user.full_name },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function createSession(user: MockUser): Session {
  return {
    access_token: `mock-token-${user.id}`,
    token_type: 'bearer',
    expires_in: 60 * 60 * 24,
    refresh_token: `mock-refresh-${user.id}`,
    user: toAuthUser(user) as Session['user'],
    provider_token: null,
    provider_refresh_token: null,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  } satisfies Session;
}

class MockSupabaseAuth {
  private listeners = new Set<AuthListener>();
  private getData: () => MockData;
  private setData: (next: MockData) => void;
  private currentSession: Session | null;

  constructor(getData: () => MockData, setData: (next: MockData) => void) {
    this.getData = getData;
    this.setData = setData;
    this.currentSession = readSession();

    const session = this.currentSession;
    if (session) {
      const exists = this.getData().users.some((user) => user.id === session.user.id);
      if (!exists) {
        this.currentSession = null;
        writeSession(null);
      }
    }
  }

  private setSession(session: Session | null, event: AuthChangeEvent) {
    this.currentSession = session ? clone(session) : null;
    writeSession(this.currentSession);
    this.emit(event, this.currentSession);
  }

  private emit(event: AuthChangeEvent, session: Session | null) {
    this.listeners.forEach((listener) => listener(event, session ? clone(session) : null));
  }

  private findUserByEmail(email: string): MockUser | undefined {
    return this.getData().users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  private updateUser(user: MockUser) {
    const data = this.getData();
    const index = data.users.findIndex((item) => item.id === user.id);
    if (index >= 0) {
      data.users[index] = clone(user);
      this.setData({ ...data, users: [...data.users] });
    }
  }

  get activeSession(): Session | null {
    return this.currentSession ? clone(this.currentSession) : null;
  }

  get activeUser(): MockUser | null {
    if (!this.currentSession) {
      return null;
    }
    const user = this.getData().users.find((item) => item.id === this.currentSession?.user.id);
    return user ? clone(user) : null;
  }

  async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    return { data: { session: this.activeSession }, error: null };
  }

  async getUser(): Promise<{ data: { user: ReturnType<typeof toAuthUser> | null }; error: null }> {
    const user = this.activeUser;
    return { data: { user: user ? toAuthUser(user) : null }, error: null };
  }

  async signOut(): Promise<{ error: null }> {
    this.setSession(null, 'SIGNED_OUT');
    return { error: null };
  }

  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const user = this.findUserByEmail(email);

    if (!user || (user.password && user.password !== password)) {
      return {
        data: { user: null, session: null },
        error: createAuthError('Invalid login credentials.'),
      } as unknown as AuthResponse;
    }

    const session = createSession(user);
    this.setSession(session, 'SIGNED_IN');

    return {
      data: { user: toAuthUser(user), session },
      error: null,
    } as unknown as AuthResponse;
  }

  async signInWithOtp({
    email,
  }: {
    email: string;
    options?: { shouldCreateUser?: boolean };
  }): Promise<AuthResponse> {
    let user = this.findUserByEmail(email);

    if (!user) {
      user = {
        id: generateId('mock-user'),
        email,
        full_name: email,
        membership_type: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        password: 'otp-login',
      };

      const data = this.getData();
      data.users = [...data.users, user];
      this.setData({ ...data, users: [...data.users] });
    }

    const session = createSession(user);
    this.setSession(session, 'SIGNED_IN');

    return {
      data: { user: toAuthUser(user), session },
      error: null,
    } as unknown as AuthResponse;
  }

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: { full_name?: string | null } };
  }): Promise<AuthResponse> {
    const existing = this.findUserByEmail(email);

    if (existing) {
      return {
        data: { user: null, session: null },
        error: createAuthError('User already registered.'),
      } as unknown as AuthResponse;
    }

    const fullName = options?.data?.full_name ?? null;

    const user: MockUser = {
      id: generateId('mock-user'),
      email,
      full_name: fullName ?? email,
      membership_type: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      password,
    };

    const data = this.getData();
    data.users = [...data.users, user];
    this.setData({ ...data, users: [...data.users] });

    const session = createSession(user);
    this.setSession(session, 'SIGNED_IN');

    return {
      data: { user: toAuthUser(user), session },
      error: null,
    } as unknown as AuthResponse;
  }

  onAuthStateChange(callback: AuthListener) {
    this.listeners.add(callback);

    const unsubscribe = () => {
      this.listeners.delete(callback);
    };

    callback('INITIAL_SESSION', this.activeSession);

    return {
      data: {
        subscription: {
          id: generateId('mock-subscription'),
          unsubscribe,
        },
      },
      error: null,
    };
  }
}

class MockPostgrestQuery<T extends TableName> {
  private operation: OperationState = {
    type: 'select',
    returning: true,
    filters: [],
  };

  constructor(private client: MockSupabaseClient, private table: T) {}

  select(): this {
    if (this.operation.type === 'insert' || this.operation.type === 'update') {
      this.operation.returning = true;
    } else {
      this.operation.type = 'select';
      this.operation.returning = true;
    }
    return this;
  }

  insert(payload: unknown): this {
    this.operation.type = 'insert';
    this.operation.payload = payload;
    this.operation.returning = false;
    return this;
  }

  update(payload: unknown): this {
    this.operation.type = 'update';
    this.operation.payload = payload;
    return this;
  }

  delete(): this {
    this.operation.type = 'delete';
    return this;
  }

  eq(column: string, value: unknown): this {
    this.operation.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.operation.order = {
      column,
      ascending: options?.ascending ?? true,
    };
    return this;
  }

  single(): Promise<PostgrestLikeResponse<unknown>> {
    this.operation.single = 'single';
    return this.execute();
  }

  maybeSingle(): Promise<PostgrestLikeResponse<unknown>> {
    this.operation.single = 'maybe';
    return this.execute();
  }

  then<TResult1 = PostgrestLikeResponse<unknown>, TResult2 = never>(
    onfulfilled?: ((value: PostgrestLikeResponse<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ) {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null) {
    return this.execute().finally(onfinally ?? undefined);
  }

  private async execute(): Promise<PostgrestLikeResponse<unknown>> {
    const { type } = this.operation;

    switch (type) {
      case 'insert':
        return this.executeInsert();
      case 'update':
        return this.executeUpdate();
      case 'delete':
        return this.executeDelete();
      default:
        return this.executeSelect();
    }
  }

  private executeSelect(): Promise<PostgrestLikeResponse<unknown>> {
    let rows = this.getRows();

    rows = this.applyFilters(rows);
    rows = this.applyRowLevelSecurity(rows);

    if (this.operation.order) {
      const { column, ascending } = this.operation.order;
      rows = [...rows].sort((a, b) => {
        const left = (a as Record<string, unknown>)[column];
        const right = (b as Record<string, unknown>)[column];
        if (left === right) {
          return 0;
        }
        if (left === undefined || left === null) {
          return ascending ? 1 : -1;
        }
        if (right === undefined || right === null) {
          return ascending ? -1 : 1;
        }
        return ascending
          ? `${left}`.localeCompare(`${right}`)
          : `${right}`.localeCompare(`${left}`);
      });
    }

    if (this.operation.single) {
      const row = rows[0] ?? null;
      if (!row && this.operation.single === 'single') {
        return Promise.resolve({ data: null, error: createNotFoundError(this.table) });
      }
      return Promise.resolve({ data: row ?? null, error: null });
    }

    return Promise.resolve({ data: rows, error: null });
  }

  private executeInsert(): Promise<PostgrestLikeResponse<unknown>> {
    const rows = Array.isArray(this.operation.payload)
      ? (this.operation.payload as Record<string, unknown>[])
      : [this.operation.payload as Record<string, unknown>];

    const nextRows = rows.map((row) => {
      const record = { ...row } as Record<string, unknown>;
      if (!record.id) {
        record.id = generateId(this.table.slice(0, 4));
      }
      return record;
    });

    const updatedTable = [...this.getRows(), ...nextRows.map(clone)];
    this.setRows(updatedTable);

    const result = this.operation.returning ? nextRows.map(clone) : null;

    if (this.operation.single) {
      const item = result ? (result[0] ?? null) : null;
      if (!item && this.operation.single === 'single') {
        return Promise.resolve({ data: null, error: createNotFoundError(this.table) });
      }
      return Promise.resolve({ data: item, error: null });
    }

    return Promise.resolve({ data: result, error: null });
  }

  private executeUpdate(): Promise<PostgrestLikeResponse<unknown>> {
    const rows = this.getRows();
    const payload = (this.operation.payload ?? {}) as Record<string, unknown>;
    const filters = this.operation.filters;

    const updatedRows: Record<string, unknown>[] = [];
    const nextTable = rows.map((row) => {
      const matches = filters.every((filter) => row[filter.column] === filter.value);
      if (!matches) {
        return row;
      }
      const updated = { ...row, ...payload };
      updatedRows.push(updated);
      return updated;
    });

    this.setRows(nextTable);

    const result = this.operation.returning ? updatedRows.map(clone) : null;

    if (this.operation.single) {
      const item = result ? (result[0] ?? null) : null;
      if (!item && this.operation.single === 'single') {
        return Promise.resolve({ data: null, error: createNotFoundError(this.table) });
      }
      return Promise.resolve({ data: item, error: null });
    }

    return Promise.resolve({ data: result, error: null });
  }

  private executeDelete(): Promise<PostgrestLikeResponse<unknown>> {
    const rows = this.getRows();
    const filters = this.operation.filters;
    const keptRows: Record<string, unknown>[] = [];
    const removedRows: Record<string, unknown>[] = [];

    rows.forEach((row) => {
      const matches = filters.every((filter) => row[filter.column] === filter.value);
      if (matches) {
        removedRows.push(row);
      } else {
        keptRows.push(row);
      }
    });

    this.setRows(keptRows);

    if (this.operation.returning) {
      const data = removedRows.map(clone);
      return Promise.resolve({ data, error: null });
    }

    return Promise.resolve({ data: null, error: null });
  }

  private getRows(): Record<string, unknown>[] {
    const data = this.client.getData();
    return data[this.table].map(clone) as Record<string, unknown>[];
  }

  private setRows(rows: Record<string, unknown>[]) {
    const data = this.client.getData();
    data[this.table] = rows.map(clone) as MockData[T];
    this.client.setData(data);
  }

  private applyFilters(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    if (this.operation.filters.length === 0) {
      return rows;
    }

    return rows.filter((row) =>
      this.operation.filters.every((filter) => row[filter.column] === filter.value),
    );
  }

  private applyRowLevelSecurity(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    const user = this.client.auth.activeUser;
    if (!user) {
      return rows;
    }

    return rows.filter((row) => {
      if ('user_id' in row && row.user_id) {
        return row.user_id === user.id;
      }

      if (this.table === 'payments' && 'debt_id' in row && row.debt_id) {
        const debt = this.client
          .getData()
          .debts.find((item) => item.id === row.debt_id);
        return debt ? debt.user_id === user.id : false;
      }

      return true;
    });
  }
}

export class MockSupabaseClient {
  auth: MockSupabaseAuth;

  constructor(private data: MockData) {
    this.auth = new MockSupabaseAuth(this.getData, this.setData);
  }

  getData = (): MockData => {
    if (!this.data) {
      this.data = clone(readData());
    }
    return this.data;
  };

  setData = (next: MockData) => {
    this.data = clone(next);
    writeData(this.data);
  };

  from<T extends TableName>(table: T) {
    return new MockPostgrestQuery<T>(this, table);
  }
}

export function createMockSupabaseClient(): Pick<SupabaseClient, 'auth' | 'from'> {
  return new MockSupabaseClient(readData()) as unknown as Pick<SupabaseClient, 'auth' | 'from'>;
}

export const MOCK_SUPABASE_NOTICE =
  '目前正在使用 Mock Supabase Client。要連線至實際 Supabase，請將 VITE_SUPABASE_USE_MOCK 設為 false 並提供有效的環境變數。';
