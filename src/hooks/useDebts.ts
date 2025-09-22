/**
 * React hook that provides debt data with realtime updates.
 *
 * The hook listens to Supabase realtime changes on `debts` and `payments`
 * tables, ensuring the returned data stays in sync with backend mutations.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  CreateDebtPayload,
  Debt,
  VDebtProgress,
} from '../lib/db';
import {
  createDebt as createDebtMutation,
  listDebtProgress,
  listDebts,
  removeDebt as removeDebtMutation,
} from '../lib/db';
import supabase from '../lib/supabaseClient';

export interface DebtRow extends Debt {
  total_paid: string;
  paid_percent: string;
  remaining_balance?: string | null;
  last_payment_date?: string | null;
}

export interface UseDebtsResult {
  rows: DebtRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  createDebt: (payload: CreateDebtPayload) => Promise<Debt>;
  removeDebt: (debtId: string) => Promise<void>;
}

const mergeDebtsWithProgress = (
  debts: Debt[],
  progresses: VDebtProgress[],
): DebtRow[] => {
  const progressMap = new Map<string, VDebtProgress>();
  progresses.forEach((progress) => {
    progressMap.set(progress.debt_id, progress);
  });

  return debts.map((debt) => {
    const progress = progressMap.get(debt.id);
    return {
      ...debt,
      total_paid: progress?.total_paid ?? '0',
      paid_percent: progress?.paid_percent ?? '0',
      remaining_balance: progress?.remaining_balance ?? null,
      last_payment_date: progress?.last_payment_date ?? null,
    };
  });
};

const useDebts = (): UseDebtsResult => {
  const [rows, setRows] = useState<DebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setLoading(true);
    try {
      const [debtsData, progressData] = await Promise.all([
        listDebts(),
        listDebtProgress(),
      ]);
      if (!isMountedRef.current) {
        return;
      }
      setRows(mergeDebtsWithProgress(debtsData, progressData));
    } catch (error) {
      console.error('Failed to refresh debts data', error);
      if (isMountedRef.current) {
        setRows([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel('public:debts-payments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts' },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const handleCreateDebt = useCallback(
    async (payload: CreateDebtPayload) => {
      const debt = await createDebtMutation(payload);
      await refresh();
      return debt;
    },
    [refresh],
  );

  const handleRemoveDebt = useCallback(
    async (debtId: string) => {
      await removeDebtMutation(debtId);
      await refresh();
    },
    [refresh],
  );

  return {
    rows,
    loading,
    refresh,
    createDebt: handleCreateDebt,
    removeDebt: handleRemoveDebt,
  };
};

export default useDebts;
