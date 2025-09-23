import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';

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

const DebtWiseAItsx = () => {
  const auth = useAuthLogic();

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
