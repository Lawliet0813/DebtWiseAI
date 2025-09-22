/**
 * Application root component wiring authentication flow with dashboard pages.
 */
import { useEffect, useMemo, useState } from 'react';

import useAuth from './hooks/useAuth';
import { upsertMyProfile } from './lib/db';
import AuthGate from './pages/AuthGate';
import DebtDashboard from './pages/DebtDashboard';

const App = () => {
  const { session, loading } = useAuth();
  const [profileSyncing, setProfileSyncing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const authenticatedUserId = useMemo(() => session?.user?.id ?? null, [session]);

  useEffect(() => {
    if (!authenticatedUserId) {
      return;
    }

    let isActive = true;

    const syncProfile = async () => {
      setProfileSyncing(true);
      setProfileError(null);

      try {
        await upsertMyProfile();
      } catch (error) {
        if (!isActive) return;

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to synchronize your profile with the database.';
        setProfileError(message);
      } finally {
        if (!isActive) return;
        setProfileSyncing(false);
      }
    };

    syncProfile();

    return () => {
      isActive = false;
    };
  }, [authenticatedUserId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        <p className="text-lg font-medium">Loading authentication state…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {profileSyncing && (
        <div className="bg-blue-50 px-4 py-3 text-sm text-blue-700">
          正在同步您的檔案資料…
        </div>
      )}
      {profileError && (
        <div className="bg-red-50 px-4 py-3 text-sm text-red-700">
          {profileError}
        </div>
      )}
      <DebtDashboard />
    </div>
  );
};

export default App;
