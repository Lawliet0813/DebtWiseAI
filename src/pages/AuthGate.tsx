/**
 * Authentication gate page.
 *
 * Provides email OTP and anonymous sign-in options, and ensures the
 * authenticated user has a corresponding profile record.
 */
import { FormEvent, useEffect, useRef, useState } from 'react';

import { upsertMyProfile } from '../lib/db';
import supabase from '../lib/supabaseClient';
import useAuth from '../hooks/useAuth';

const AuthGate = (): JSX.Element => {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileSyncing, setProfileSyncing] = useState(false);
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const syncProfile = async () => {
      if (!session?.user?.id) return;
      if (syncedUserIdRef.current === session.user.id) return;

      setProfileSyncing(true);
      try {
        await upsertMyProfile();
        syncedUserIdRef.current = session.user.id;
        setStatusMessage('登入成功，使用者資料已同步。');
        setErrorMessage(null);
      } catch (err) {
        console.error('Failed to sync user profile', err);
        setErrorMessage('同步使用者資料時發生錯誤，請稍後再試。');
      } finally {
        setProfileSyncing(false);
      }
    };

    void syncProfile();
  }, [session]);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setErrorMessage('請輸入電子郵件地址。');
      return;
    }

    setActionLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        throw error;
      }

      setStatusMessage('已寄出登入連結，請檢查電子郵件信箱。');
    } catch (err) {
      console.error('Email OTP sign-in failed', err);
      setErrorMessage('寄送登入連結失敗，請稍後再試。');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setActionLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        throw error;
      }

      setStatusMessage('已使用匿名模式登入。');
    } catch (err) {
      console.error('Anonymous sign-in failed', err);
      setErrorMessage('匿名登入失敗，請稍後再試。');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      syncedUserIdRef.current = null;
    } catch (err) {
      console.error('Sign-out failed', err);
      setErrorMessage('登出失敗，請稍後再試。');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-base text-slate-600">載入中…</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">歡迎回來！</h1>
            <p className="text-sm text-slate-600">
              已登入帳號：{session.user.email ?? '匿名使用者'}
            </p>
          </div>
          {profileSyncing ? (
            <p className="text-sm text-blue-600">同步使用者資料中…</p>
          ) : null}
          {statusMessage ? <p className="text-sm text-emerald-600">{statusMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={actionLoading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            登出
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">登入 DebtWise</h1>
          <p className="text-sm text-slate-600">選擇以下方式開始使用您的帳戶。</p>
        </div>
        <form className="space-y-3" onSubmit={handleEmailLogin}>
          <label className="block text-left text-sm font-medium text-slate-700">
            電子郵件
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            />
          </label>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            寄送 Email OTP 登入連結
          </button>
        </form>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            或
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            onClick={handleAnonymousLogin}
            disabled={actionLoading}
            className="w-full rounded-md border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:border-slate-400 disabled:text-slate-400"
          >
            匿名登入
          </button>
        </div>
        {statusMessage ? <p className="text-sm text-center text-emerald-600">{statusMessage}</p> : null}
        {errorMessage ? <p className="text-sm text-center text-rose-600">{errorMessage}</p> : null}
      </div>
    </div>
  );
};

export default AuthGate;
