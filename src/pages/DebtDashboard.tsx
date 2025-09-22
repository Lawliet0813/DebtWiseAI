/**
 * Debt dashboard page that combines debt overview and creation utilities.
 */
import { FormEvent, useMemo, useState } from 'react';

import useDebts from '../hooks/useDebts';
import usePayments from '../hooks/usePayments';

const currencyFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatCurrency = (value: string | number | null | undefined): string => {
  return currencyFormatter.format(Number(value ?? 0));
};

const formatPercent = (value: string | number | null | undefined): string => {
  return percentFormatter.format(Number(value ?? 0));
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

const DebtDashboard = (): JSX.Element => {
  const { rows, loading, refresh, createDebt, removeDebt } = useDebts();
  const { addPayment } = usePayments();

  const [name, setName] = useState('');
  const [originalAmount, setOriginalAmount] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [minimumPayment, setMinimumPayment] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const orderedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [rows]);

  const resetForm = () => {
    setName('');
    setOriginalAmount('');
    setInterestRate('');
    setMinimumPayment('');
    setDueDate('');
  };

  const handleCreateDebt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormMessage(null);

    if (!name.trim()) {
      setFormError('請輸入債務名稱。');
      return;
    }

    if (originalAmount === '' || interestRate === '' || minimumPayment === '') {
      setFormError('請完整填寫所有數值欄位。');
      return;
    }

    if (interestRate < 0 || interestRate > 1) {
      setFormError('利率必須介於 0 到 1 之間。');
      return;
    }

    const originalAmountValue = Number(originalAmount);
    const interestRateValue = Number(interestRate);
    const minimumPaymentValue = Number(minimumPayment);

    if (originalAmountValue <= 0 || minimumPaymentValue <= 0) {
      setFormError('金額需大於 0。');
      return;
    }

    setSubmitting(true);

    try {
      await createDebt({
        name: name.trim(),
        balance: originalAmountValue,
        original_amount: originalAmountValue,
        interest_rate: interestRateValue,
        minimum_payment: minimumPaymentValue,
        due_date: dueDate ? dueDate : null,
        debt_type: 'other',
      });
      resetForm();
      setFormMessage('已新增債務。');
    } catch (error) {
      console.error('Failed to create debt', error);
      setFormError('新增債務時發生錯誤，請稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (debtId: string, debtName: string) => {
    setActionMessage(null);
    setActionError(null);

    const input = window.prompt(`請輸入「${debtName}」的付款金額：`);
    if (input === null) {
      return;
    }

    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('付款金額需為大於 0 的數字。');
      return;
    }

    try {
      await addPayment({
        debt_id: debtId,
        amount,
        payment_date: new Date().toISOString(),
        payment_type: 'regular',
      });
      setActionMessage('已新增付款紀錄。');
      await refresh();
    } catch (error) {
      console.error('Failed to add payment', error);
      setActionError('新增付款時發生錯誤，請稍後再試。');
    }
  };

  const handleRemoveDebt = async (debtId: string, debtName: string) => {
    setActionMessage(null);
    setActionError(null);

    const confirmed = window.confirm(`確定要刪除「${debtName}」嗎？此動作無法復原。`);
    if (!confirmed) {
      return;
    }

    try {
      await removeDebt(debtId);
      setActionMessage('已刪除債務。');
    } catch (error) {
      console.error('Failed to remove debt', error);
      setActionError('刪除債務時發生錯誤，請稍後再試。');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900">債務儀表板</h1>
            <button
              type="button"
              onClick={() => {
                setActionMessage(null);
                setActionError(null);
                void refresh();
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              重新整理
            </button>
          </div>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateDebt}>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              債務名稱
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：信用卡"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              原始金額
              <input
                type="number"
                min="0"
                step="0.01"
                value={originalAmount === '' ? '' : originalAmount}
                onChange={(event) => {
                  const value = event.target.value;
                  setOriginalAmount(value === '' ? '' : Number(value));
                }}
                placeholder="例如：120000"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              利率 (0-1)
              <input
                type="number"
                min="0"
                max="1"
                step="0.001"
                value={interestRate === '' ? '' : interestRate}
                onChange={(event) => {
                  const value = event.target.value;
                  setInterestRate(value === '' ? '' : Number(value));
                }}
                placeholder="例如：0.18"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              每月最低還款
              <input
                type="number"
                min="0"
                step="0.01"
                value={minimumPayment === '' ? '' : minimumPayment}
                onChange={(event) => {
                  const value = event.target.value;
                  setMinimumPayment(value === '' ? '' : Number(value));
                }}
                placeholder="例如：5000"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2 md:max-w-xs">
              到期日
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? '新增中…' : '新增債務'}
              </button>
              {formError ? (
                <p className="mt-2 text-sm text-rose-600">{formError}</p>
              ) : null}
              {formMessage ? (
                <p className="mt-2 text-sm text-emerald-600">{formMessage}</p>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">債務清單</h2>
            <p className="text-sm text-slate-600">
              顯示每筆債務的原始金額、目前餘額、累計付款與還款進度。
            </p>
          </div>
          {actionError ? <p className="mb-3 text-sm text-rose-600">{actionError}</p> : null}
          {actionMessage ? <p className="mb-3 text-sm text-emerald-600">{actionMessage}</p> : null}
          {loading ? (
            <p className="text-sm text-slate-600">資料載入中…</p>
          ) : orderedRows.length === 0 ? (
            <p className="text-sm text-slate-600">目前沒有債務資料。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">名稱</th>
                    <th className="px-4 py-3 font-medium">原始金額</th>
                    <th className="px-4 py-3 font-medium">目前餘額</th>
                    <th className="px-4 py-3 font-medium">累計付款</th>
                    <th className="px-4 py-3 font-medium">還款進度</th>
                    <th className="px-4 py-3 font-medium">到期日</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orderedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(row.original_amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(row.balance)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(row.total_paid)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatPercent(row.paid_percent)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(row.due_date)}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleRecordPayment(row.id, row.name)}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                          >
                            付款
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleRemoveDebt(row.id, row.name)}
                            className="rounded-md border border-rose-500 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DebtDashboard;
