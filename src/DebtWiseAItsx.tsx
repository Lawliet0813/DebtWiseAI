import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import type { User } from '@supabase/supabase-js';

import supabase from '@/lib/supabaseBrowser';
import type { Debt, DebtStatus, DebtType } from '@/types/db';

type AuthField = 'name' | 'email' | 'password';

type Profile = {
  name: string | null;
  membership_type: string | null;
};

export const useAuthLogic = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const setField = useCallback((field: AuthField, value: string) => {
    setNotice('');
    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      default:
        break;
    }
  }, []);

  const run = useCallback(async (operation: () => Promise<string | void>) => {
    setLoading(true);
    setNotice('');
    try {
      const message = await operation();
      if (typeof message === 'string') {
        setNotice(message);
      }
    } catch (error) {
      const fallback =
        error instanceof Error ? error.message : '操作失敗，請稍後再試。';
      setNotice(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async () => {
    if (!email || !password) {
      setNotice('請輸入電子郵件與密碼。');
      return;
    }

    await run(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        throw error;
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new Error('註冊成功但未取得使用者資料。');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name,
          membership_type: 'free',
        });
      // profiles 表僅儲存自訂欄位（例如 name、membership_type），email 由 Auth 管理。

      if (profileError && profileError.code !== '23505') {
        throw profileError;
      }

      return '註冊成功，已建立 free 會員資料。';
    });
  }, [email, name, password, run]);

  const signIn = useCallback(async () => {
    if (!email || !password) {
      setNotice('請輸入電子郵件與密碼。');
      return;
    }

    await run(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return '登入成功。';
    });
  }, [email, password, run]);

  const signOut = useCallback(async () => {
    await run(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return '已登出。';
    });
  }, [run]);

  const fetchMe = useCallback(async () => {
    await run(async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return '目前沒有登入的使用者。';
      }

      const emailAddress = user.email ?? '使用者';

      const { data: profile, error: profileError } = await supabase
        .from<Profile>('profiles')
        .select('name, membership_type')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profile) {
        return `已登入 ${emailAddress}，但找不到會員資料。`;
      }

      const membership = profile.membership_type ?? '未知方案';
      const displayName = profile.name ?? emailAddress;
      return `歡迎 ${displayName}，會員方案：${membership}`;
    });
  }, [run]);

  return {
    name,
    email,
    password,
    loading,
    notice,
    setField,
    signUp,
    signIn,
    signOut,
    fetchMe,
  };
};

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  credit_card: '信用卡',
  auto_loan: '車貸',
  student_loan: '學貸',
  mortgage: '房貸',
  personal_loan: '個人信貸',
  medical_debt: '醫療費用',
  other: '其他',
};

const DEBT_TYPE_OPTIONS = Object.entries(DEBT_TYPE_LABELS) as Array<[
  DebtType,
  string,
]>;

type DebtFormState = {
  name: string;
  originalAmount: string;
  balance: string;
  interestRate: string;
  minimumPayment: string;
  dueDate: string;
  debtType: DebtType;
  notes: string;
};

type DebtSummaryRow = Record<string, unknown>;
type PlanNextActionRow = Record<string, unknown>;

const INITIAL_DEBT_FORM: DebtFormState = {
  name: '',
  originalAmount: '',
  balance: '',
  interestRate: '',
  minimumPayment: '',
  dueDate: '',
  debtType: 'credit_card',
  notes: '',
};

const parseRequiredNumber = (value: string, label: string): number => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} 為必填欄位。`);
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} 必須是數字。`);
  }
  return parsed;
};

const parseOptionalNumber = (value: string, label: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} 必須是數字。`);
  }
  return parsed;
};

const formatCurrency = (value: number | null | undefined): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(numeric);
};

const formatPercent = (value: number | null | undefined): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0.00%';
  }
  return `${numeric.toFixed(2)}%`;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('zh-TW');
};

const formatJson = (value: unknown): string => JSON.stringify(value, null, 2);

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const DebtWiseAItsx = () => {
  const auth = useAuthLogic();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(false);
  const [isCreatingDebt, setIsCreatingDebt] = useState(false);
  const [debtMessage, setDebtMessage] = useState('');
  const [debtError, setDebtError] = useState<string | null>(null);
  const [debtForm, setDebtForm] = useState<DebtFormState>({
    ...INITIAL_DEBT_FORM,
  });
  const [summaryRows, setSummaryRows] = useState<DebtSummaryRow[]>([]);
  const [nextActionRows, setNextActionRows] = useState<PlanNextActionRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [nextActionsLoading, setNextActionsLoading] = useState(false);
  const [viewMessage, setViewMessage] = useState('');
  const [viewError, setViewError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) {
        return;
      }
      if (error) {
        console.error('[DebtWiseAItsx] 取得使用者失敗:', error);
        setCurrentUser(null);
        return;
      }
      setCurrentUser(data.user ?? null);
    };

    void syncUser();

    const authListener = supabase.auth.onAuthStateChange((_, session) => {
      if (!isMounted) {
        return;
      }
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authListener.data?.subscription.unsubscribe();
    };
  }, []);

  const requireUser = useCallback(async (): Promise<User> => {
    if (currentUser) {
      return currentUser;
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    if (!user) {
      throw new Error('尚未登入，請先登入後再試。');
    }
    setCurrentUser(user);
    return user;
  }, [currentUser]);

  const handleDebtFormChange = useCallback(
    (
      field: keyof DebtFormState,
    ) =>
      (
        event: ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
      ) => {
        const { value } = event.target;
        setDebtForm((prev) => ({
          ...prev,
          [field]: field === 'debtType' ? (value as DebtType) : value,
        }));
      },
    [],
  );

  const handleFetchDebts = useCallback(async () => {
    setDebtsLoading(true);
    setDebtError(null);
    setDebtMessage('');
    try {
      const user = await requireUser();
      const { data, error } = await supabase
        .from<Debt>('debts')
        .select(
          'id, user_id, name, balance, original_amount, interest_rate, minimum_payment, due_date, debt_type, status, notes, created_at, updated_at',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const rows = data ?? [];
      setDebts(rows);
      setDebtMessage(`已載入 ${rows.length} 筆債務資料。`);
    } catch (error) {
      setDebtError(getErrorMessage(error, '讀取債務資料失敗，請稍後再試。'));
    } finally {
      setDebtsLoading(false);
    }
  }, [requireUser]);

  const handleCreateDebt = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsCreatingDebt(true);
      setDebtError(null);
      setDebtMessage('');
      try {
        const user = await requireUser();
        const name = debtForm.name.trim();
        if (!name) {
          throw new Error('請輸入債務名稱。');
        }

        const originalAmount = parseRequiredNumber(
          debtForm.originalAmount,
          '原始金額',
        );
        const balance =
          debtForm.balance.trim() === ''
            ? originalAmount
            : parseRequiredNumber(debtForm.balance, '目前餘額');
        const minimumPayment = parseRequiredNumber(
          debtForm.minimumPayment,
          '每月最低還款金額',
        );
        const interestRate =
          parseOptionalNumber(debtForm.interestRate, '年利率') ?? 0;
        const dueDateIso = debtForm.dueDate
          ? new Date(`${debtForm.dueDate}T00:00:00`).toISOString()
          : null;

        const { data, error } = await supabase
          .from<Debt>('debts')
          .insert({
            user_id: user.id,
            name,
            original_amount: originalAmount,
            balance,
            minimum_payment: minimumPayment,
            interest_rate: interestRate,
            due_date: dueDateIso,
            debt_type: debtForm.debtType,
            status: 'active' as DebtStatus,
            notes: debtForm.notes.trim() ? debtForm.notes.trim() : null,
          })
          .select(
            'id, user_id, name, balance, original_amount, interest_rate, minimum_payment, due_date, debt_type, status, notes, created_at, updated_at',
          )
          .single();

        if (error) {
          throw error;
        }

        const inserted = data;
        if (inserted) {
          setDebts((prev) => [inserted, ...prev]);
        }
        setDebtForm({ ...INITIAL_DEBT_FORM });
        setDebtMessage('新增債務成功。');
      } catch (error) {
        setDebtError(getErrorMessage(error, '新增債務失敗，請稍後再試。'));
      } finally {
        setIsCreatingDebt(false);
      }
    },
    [debtForm, requireUser],
  );

  const handleFetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setViewError(null);
    setViewMessage('');
    try {
      const user = await requireUser();
      const { data, error } = await supabase
        .from<DebtSummaryRow>('v_debt_summary')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as DebtSummaryRow[];
      setSummaryRows(rows);
      setViewMessage(`v_debt_summary 取得 ${rows.length} 筆資料。`);
    } catch (error) {
      setViewError(getErrorMessage(error, '讀取 v_debt_summary 失敗，請稍後再試。'));
    } finally {
      setSummaryLoading(false);
    }
  }, [requireUser]);

  const handleFetchNextActions = useCallback(async () => {
    setNextActionsLoading(true);
    setViewError(null);
    setViewMessage('');
    try {
      const user = await requireUser();
      const { data, error } = await supabase
        .from<PlanNextActionRow>('v_plan_next_actions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as PlanNextActionRow[];
      setNextActionRows(rows);
      setViewMessage(`v_plan_next_actions 取得 ${rows.length} 筆資料。`);
    } catch (error) {
      setViewError(
        getErrorMessage(error, '讀取 v_plan_next_actions 失敗，請稍後再試。'),
      );
    } finally {
      setNextActionsLoading(false);
    }
  }, [requireUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">DebtWise AI Auth</h1>
          <p className="text-sm text-slate-600">
            使用 Supabase Auth 建立、登入並管理您的帳號。
          </p>
        </header>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            姓名
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={auth.name}
              onChange={(event) => auth.setField('name', event.target.value)}
              placeholder="輸入顯示名稱"
              disabled={auth.loading}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            電子郵件
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="email"
              value={auth.email}
              onChange={(event) => auth.setField('email', event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={auth.loading}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            密碼
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="password"
              value={auth.password}
              onChange={(event) => auth.setField('password', event.target.value)}
              placeholder="輸入至少 6 碼密碼"
              autoComplete="current-password"
              disabled={auth.loading}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              void auth.signUp();
            }}
            disabled={auth.loading}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            註冊
          </button>
          <button
            type="button"
            onClick={() => {
              void auth.signIn();
            }}
            disabled={auth.loading}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            登入
          </button>
          <button
            type="button"
            onClick={() => {
              void auth.signOut();
            }}
            disabled={auth.loading}
            className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            登出
          </button>
          <button
            type="button"
            onClick={() => {
              void auth.fetchMe();
            }}
            disabled={auth.loading}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            讀取目前使用者
          </button>
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-4">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">債務資料</h2>
              <button
                type="button"
                onClick={() => {
                  void handleFetchDebts();
                }}
                disabled={debtsLoading}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {debtsLoading ? '讀取中…' : '查詢 debts'}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              從 Supabase public.debts 撈取屬於目前登入者的資料。
            </p>
            {debtError ? <p className="text-sm text-red-600">{debtError}</p> : null}
            {debtMessage ? (
              <p className="text-sm text-emerald-600">{debtMessage}</p>
            ) : null}
            <div className="space-y-2">
              {debts.map((debt) => {
                const typeLabel = DEBT_TYPE_LABELS[debt.debt_type] ?? debt.debt_type;
                return (
                  <article
                    key={debt.id}
                    className="rounded-md border border-slate-200 p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">
                        {debt.name}
                      </p>
                      <span className="text-xs text-slate-600">{typeLabel}</span>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div>
                        <dt className="font-medium text-slate-500">餘額</dt>
                        <dd>{formatCurrency(debt.balance)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500">原始金額</dt>
                        <dd>{formatCurrency(debt.original_amount)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500">年利率</dt>
                        <dd>{formatPercent(debt.interest_rate)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500">最低還款</dt>
                        <dd>{formatCurrency(debt.minimum_payment)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-slate-500">到期日</dt>
                        <dd>{formatDate(debt.due_date)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-slate-500">狀態</dt>
                        <dd>{debt.status}</dd>
                      </div>
                      {debt.notes ? (
                        <div className="col-span-2">
                          <dt className="font-medium text-slate-500">備註</dt>
                          <dd className="break-words text-slate-700">{debt.notes}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                );
              })}
            </div>
            {debts.length === 0 && !debtsLoading ? (
              <p className="text-sm text-slate-500">尚未載入任何債務資料。</p>
            ) : null}
          </section>

          <section className="space-y-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-slate-900">
              新增債務（Supabase insert）
            </h3>
            <form className="space-y-3" onSubmit={handleCreateDebt}>
              <label className="block text-sm font-medium text-slate-700">
                名稱
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={debtForm.name}
                  onChange={handleDebtFormChange('name')}
                  placeholder="例如：信用卡或貸款名稱"
                  disabled={isCreatingDebt}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  原始金額
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={debtForm.originalAmount}
                    onChange={handleDebtFormChange('originalAmount')}
                    placeholder="輸入原始借款金額"
                    disabled={isCreatingDebt}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  目前餘額
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={debtForm.balance}
                    onChange={handleDebtFormChange('balance')}
                    placeholder="若留空則使用原始金額"
                    disabled={isCreatingDebt}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  年利率（%）
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={debtForm.interestRate}
                    onChange={handleDebtFormChange('interestRate')}
                    placeholder="例如 18.5"
                    disabled={isCreatingDebt}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  每月最低還款
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={debtForm.minimumPayment}
                    onChange={handleDebtFormChange('minimumPayment')}
                    placeholder="請輸入數字"
                    disabled={isCreatingDebt}
                    required
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  到期日
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    type="date"
                    value={debtForm.dueDate}
                    onChange={handleDebtFormChange('dueDate')}
                    disabled={isCreatingDebt}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  類型
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={debtForm.debtType}
                    onChange={handleDebtFormChange('debtType')}
                    disabled={isCreatingDebt}
                  >
                    {DEBT_TYPE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                備註
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={debtForm.notes}
                  onChange={handleDebtFormChange('notes')}
                  placeholder="可填寫額外說明，例如還款策略或提醒"
                  disabled={isCreatingDebt}
                  rows={3}
                />
              </label>
              <button
                type="submit"
                disabled={isCreatingDebt}
                className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isCreatingDebt ? '新增中…' : '新增 debt'}
              </button>
            </form>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Supabase Views 測試
            </h3>
            <p className="text-xs text-slate-500">
              讀取 v_debt_summary 與 v_plan_next_actions，以確認視圖內容。
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleFetchSummary();
                }}
                disabled={summaryLoading}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {summaryLoading ? '讀取中…' : '讀取 v_debt_summary'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleFetchNextActions();
                }}
                disabled={nextActionsLoading}
                className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-purple-300"
              >
                {nextActionsLoading ? '讀取中…' : '讀取 v_plan_next_actions'}
              </button>
            </div>
            {viewError ? <p className="text-sm text-red-600">{viewError}</p> : null}
            {viewMessage ? (
              <p className="text-sm text-emerald-600">{viewMessage}</p>
            ) : null}
            {summaryRows.length > 0 ? (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-500">
                  v_debt_summary 結果
                </h4>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-900/90 p-3 text-[11px] text-slate-100">
                  {formatJson(summaryRows)}
                </pre>
              </div>
            ) : null}
            {nextActionRows.length > 0 ? (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-500">
                  v_plan_next_actions 結果
                </h4>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-900/90 p-3 text-[11px] text-slate-100">
                  {formatJson(nextActionRows)}
                </pre>
              </div>
            ) : null}
          </section>
        </div>

        <footer className="space-y-1">
          {auth.loading ? (
            <p className="text-sm text-slate-500">處理中…請稍候。</p>
          ) : null}
          <p className="text-sm text-slate-700">{auth.notice || ' '}</p>
        </footer>
      </div>
    </div>
  );
};

export default DebtWiseAItsx;
