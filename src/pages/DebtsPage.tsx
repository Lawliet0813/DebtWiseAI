import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useDebts } from '../hooks/useDebts';
import { createDebt } from '../services/debts';
import type { Debt, DebtStatus, DebtType } from '../types/db';

export default function DebtsPage() {
  const { data: debts, loading, error, setData } = useDebts();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onAdd = async () => {
    if (!name.trim()) {
      setFormError('請輸入債務名稱');
      return;
    }

    if (balance <= 0) {
      setFormError('請輸入有效的債務餘額');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('請先登入帳號');
      }

      const payload: Omit<Debt, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        name: name.trim(),
        balance,
        original_amount: balance,
        interest_rate: 0,
        minimum_payment: 0,
        due_date: null,
        debt_type: 'other' as DebtType,
        status: 'active' as DebtStatus,
        notes: null,
      };

      const created = await createDebt(payload);
      setData((prev) => [created, ...prev]);
      setName('');
      setBalance(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增債務時發生錯誤';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading…</div>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : '載入債務資料時發生錯誤';
    return <div>Oops: {message}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="border px-2 py-1 rounded"
          placeholder="債務名稱"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={submitting}
        />
        <input
          className="border px-2 py-1 rounded"
          placeholder="餘額"
          type="number"
          value={balance || ''}
          onChange={(event) => setBalance(Number(event.target.value) || 0)}
          disabled={submitting}
        />
        <button
          className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
          onClick={onAdd}
          disabled={submitting}
        >
          新增
        </button>
      </div>

      {formError ? <div className="text-sm text-red-600">{formError}</div> : null}

      <ul className="space-y-2">
        {debts.map((debt) => (
          <li key={debt.id} className="border rounded p-3">
            <div className="font-medium">{debt.name}</div>
            <div className="text-sm text-gray-600">餘額：{debt.balance}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
