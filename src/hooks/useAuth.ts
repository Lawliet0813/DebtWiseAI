/**
 * React hook for managing Supabase authentication state.
 *
 * The hook retrieves the initial session and subscribes to future auth changes,
 * ensuring components always have the latest session information.
 */
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import supabase from '../lib/supabaseClient';

export interface UseAuthResult {
  session: Session | null;
  loading: boolean;
}

const useAuth = (): UseAuthResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          console.error('Failed to get auth session', error);
        }

        setSession(data.session ?? null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
};

export default useAuth;
