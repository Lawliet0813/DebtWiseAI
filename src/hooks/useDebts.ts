import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { Debt } from '../types/db';
import { listDebts } from '../services/debts';

type UseDebtsResult = {
  data: Debt[];
  loading: boolean;
  error: Error | null;
  setData: Dispatch<SetStateAction<Debt[]>>;
};

export function useDebts(): UseDebtsResult {
  const [data, setData] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        const results = await listDebts();
        if (isMounted) {
          setData(results);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load debts.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error, setData };
}
