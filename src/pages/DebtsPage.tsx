import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  DollarSign,
  Flag,
  Target,
  TrendingDown,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useDebts } from '../hooks/useDebts';
import { createDebt, removeDebt, updateDebt } from '../services/debts';
import type { Debt, DebtType } from '../types/db';
import AddDebtForm from '../components/AddDebtForm';
import EditDebtForm from '../components/EditDebtForm';
import DebtsList from '../components/DebtsList';
import PaymentStrategy from '../components/PaymentStrategy';
import PaymentPlan from '../components/PaymentPlan';
import {
  calculateExtraPaymentEffect,
  compareStrategies,
} from '../algorithms/debtStrategies';

type UiDebt = {
  id: string;
  name: string;
  principal: number;
  originalPrincipal: number;
  interestRate: number;
  minimumPayment: number;
  totalPeriods: number;
  remainingPeriods: number;
  monthlyDueDay: number;
  dueDate: string | null;
  type: string;
  typeCode: DebtType;
  subType: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  lastPaymentAt?: string | null;
  status?: string;
};

type NotificationPriority = 'low' | 'medium' | 'high';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'payment_due' | 'tip';
  priority: NotificationPriority;
  isRead: boolean;
};

type StrategiesComparison = ReturnType<typeof compareStrategies> | null;

type GoalSetting = {
  targetMonths: number;
  monthlySaving: number;
};

const TYPE_LABEL_BY_CODE: Record<DebtType, string> = {
  credit_card: '信用卡',
  auto_loan: '車貸',
  student_loan: '學貸',
  mortgage: '房貸',
  personal_loan: '個人信貸',
  medical_debt: '醫療費用',
  other: '其他',
};

const TYPE_CODE_BY_LABEL: Record<string, DebtType> = {
  信用卡: 'credit_card',
  車貸: 'auto_loan',
  學貸: 'student_loan',
  房貸: 'mortgage',
  個人信貸: 'personal_loan',
  醫療費用: 'medical_debt',
  其他: 'other',
};

const TYPE_COLOR_MAP: Record<string, string> = {
  信用卡: 'red',
  房貸: 'blue',
  車貸: 'green',
  學貸: 'yellow',
  個人信貸: 'purple',
  醫療費用: 'pink',
  其他: 'gray',
};

const DEBT_TYPES = {
  信用卡: {
    icon: '💳',
    subTypes: ['循環信用', '信用卡分期', '現金卡', '預借現金'],
  },
  房貸: {
    icon: '🏠',
    subTypes: ['指數型房貸', '固定型房貸', '理財型房貸', '青年安心成家貸款'],
  },
  車貸: {
    icon: '🚗',
    subTypes: ['新車貸款', '中古車貸款', '機車貸款', '商用車貸款'],
  },
  學貸: {
    icon: '🎓',
    subTypes: ['政府就學貸款', '私校學費貸款', '留學貸款', '在職進修貸款'],
  },
  個人信貸: {
    icon: '💰',
    subTypes: ['信用貸款', '小額信貸', '整合性貸款', '代償性貸款'],
  },
  醫療費用: {
    icon: '🩺',
    subTypes: ['手術費用', '住院費用', '自費醫療', '其他醫療支出'],
  },
  其他: {
    icon: '📋',
    subTypes: ['民間借貸', '親友借款', '標會', '其他'],
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(value);

const extractDatePart = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  if (value.includes('T')) {
    return value.split('T')[0];
  }
  return value;
};

const getMonthlyDueDayFromDate = (value: string | null): number => {
  const datePart = extractDatePart(value);
  if (!datePart) {
    return 1;
  }
  const [, , day] = datePart.split('-');
  const parsed = Number(day);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const mapDebtRecordToUi = (debt: Debt): UiDebt => {
  const typeLabel = TYPE_LABEL_BY_CODE[debt.debt_type] ?? '其他';
  const dueDatePart = extractDatePart(debt.due_date);
  return {
    id: debt.id,
    name: debt.name,
    principal: Number(debt.balance ?? 0),
    originalPrincipal: Number(debt.original_amount ?? debt.balance ?? 0),
    interestRate: Number(debt.interest_rate ?? 0),
    minimumPayment: Number(debt.minimum_payment ?? 0),
    totalPeriods: 0,
    remainingPeriods: 0,
    monthlyDueDay: getMonthlyDueDayFromDate(dueDatePart),
    dueDate: dueDatePart,
    type: typeLabel,
    typeCode: debt.debt_type,
    subType: debt.notes ?? '',
    color: TYPE_COLOR_MAP[typeLabel] ?? 'gray',
    createdAt: debt.created_at,
    updatedAt: debt.updated_at,
    lastPaymentAt: null,
    status: debt.status,
  };
};

const GoalSection = ({
  totalDebt,
  overallProgress,
  projectedMonths,
  monthlyBudget,
  extraPayment,
}: {
  totalDebt: number;
  overallProgress: number;
  projectedMonths: number | null;
  monthlyBudget: number;
  extraPayment: number;
}) => {
  const [goal, setGoal] = useState<GoalSetting>({
    targetMonths: projectedMonths && projectedMonths > 0 ? projectedMonths : 24,
    monthlySaving: monthlyBudget + extraPayment,
  });

  useEffect(() => {
    setGoal((prev) => ({
      ...prev,
      monthlySaving: Math.max(monthlyBudget + extraPayment, prev.monthlySaving),
    }));
  }, [monthlyBudget, extraPayment]);

  const expectedMonthly = goal.targetMonths > 0
    ? Math.ceil(totalDebt / goal.targetMonths)
    : 0;

  const isOnTrack = goal.monthlySaving >= expectedMonthly;

  const goalCompletionDate = useMemo(() => {
    if (!goal.targetMonths) {
      return '—';
    }
    const base = new Date();
    base.setMonth(base.getMonth() + goal.targetMonths);
    return base.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' });
  }, [goal.targetMonths]);

  const projectedCompletionDate = useMemo(() => {
    if (!projectedMonths || projectedMonths <= 0) {
      return '—';
    }
    const base = new Date();
    base.setMonth(base.getMonth() + projectedMonths);
    return base.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' });
  }, [projectedMonths]);

  const progressTowardsGoal = Math.min(100, Math.round(overallProgress));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Target className="mr-2 text-purple-600" size={20} />
          目標設定與追蹤
        </h3>
        <span className="text-sm text-gray-500">
          已完成 {progressTowardsGoal}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">目標清償月數</span>
          <input
            type="number"
            min={1}
            value={goal.targetMonths}
            onChange={(event) =>
              setGoal((prev) => ({
                ...prev,
                targetMonths: Math.max(1, Number(event.target.value) || prev.targetMonths),
              }))
            }
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">每月儲蓄/還款目標</span>
          <input
            type="number"
            min={0}
            value={goal.monthlySaving}
            onChange={(event) =>
              setGoal((prev) => ({
                ...prev,
                monthlySaving: Math.max(0, Number(event.target.value) || 0),
              }))
            }
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <p className="text-purple-600">預估完成日期</p>
          <p className="text-lg font-bold text-purple-800">{goalCompletionDate}</p>
          <p className="text-xs text-purple-500 mt-1">
            目標月數 {goal.targetMonths} 個月
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-blue-600">目前策略預估</p>
          <p className="text-lg font-bold text-blue-800">{projectedCompletionDate}</p>
          <p className="text-xs text-blue-500 mt-1">
            {projectedMonths ? `${projectedMonths} 個月即可完成` : '請先設定月預算'}
          </p>
        </div>
        <div className={`p-4 rounded-xl border ${isOnTrack ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={isOnTrack ? 'text-green-600' : 'text-orange-600'}>
            {isOnTrack ? '進度良好' : '需要調整'}
          </p>
          <p className={`text-lg font-bold ${isOnTrack ? 'text-green-700' : 'text-orange-700'}`}>
            {isOnTrack ? '月預算足夠' : '建議提高月預算'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            需要月預算約 {formatCurrency(expectedMonthly)}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>達成目標進度</span>
          <span className="font-semibold text-gray-800">{progressTowardsGoal}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
            style={{ width: `${progressTowardsGoal}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const FinancialTools = ({
  totalDebt,
  monthlyBudget,
}: {
  totalDebt: number;
  monthlyBudget: number;
}) => {
  const [loanAmount, setLoanAmount] = useState(() => Math.max(totalDebt, 50000));
  const [loanRate, setLoanRate] = useState(6.5);
  const [loanYears, setLoanYears] = useState(3);
  const [monthlyExpense, setMonthlyExpense] = useState(Math.max(monthlyBudget, 20000));
  const [emergencyMonths, setEmergencyMonths] = useState(3);
  const [investmentAmount, setInvestmentAmount] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(6);
  const [investmentYears, setInvestmentYears] = useState(5);

  const loanCalculation = useMemo(() => {
    if (!loanAmount || !loanYears) {
      return { monthlyPayment: 0, totalInterest: 0, totalPayment: 0 };
    }
    const monthlyRate = loanRate > 0 ? loanRate / 100 / 12 : 0;
    const totalMonths = loanYears * 12;

    if (monthlyRate === 0) {
      const monthlyPayment = loanAmount / totalMonths;
      return {
        monthlyPayment,
        totalInterest: 0,
        totalPayment: monthlyPayment * totalMonths,
      };
    }

    const factor = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);
    const totalPayment = monthlyPayment * totalMonths;
    const totalInterest = totalPayment - loanAmount;
    return { monthlyPayment, totalInterest, totalPayment };
  }, [loanAmount, loanRate, loanYears]);

  const emergencyFund = useMemo(
    () => monthlyExpense * emergencyMonths,
    [monthlyExpense, emergencyMonths],
  );

  const investmentResult = useMemo(() => {
    if (!investmentAmount || !investmentYears) {
      return { futureValue: investmentAmount, gain: 0 };
    }
    const rate = expectedReturn / 100;
    const futureValue = investmentAmount * Math.pow(1 + rate, investmentYears);
    return {
      futureValue,
      gain: futureValue - investmentAmount,
    };
  }, [investmentAmount, expectedReturn, investmentYears]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-6">
      <h3 className="text-lg font-bold text-gray-800 flex items-center">
        <DollarSign className="mr-2 text-green-600" size={20} />
        財務工具計算器
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 貸款計算器 */}
        <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
          <h4 className="font-semibold text-gray-800">貸款試算</h4>
          <label className="text-sm text-gray-600 space-y-1 block">
            貸款金額
            <input
              type="number"
              value={loanAmount}
              onChange={(event) => setLoanAmount(Math.max(0, Number(event.target.value) || 0))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </label>
          <label className="text-sm text-gray-600 space-y-1 block">
            年利率 (%)
            <input
              type="number"
              step="0.1"
              value={loanRate}
              onChange={(event) => setLoanRate(Math.max(0, Number(event.target.value) || 0))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </label>
          <label className="text-sm text-gray-600 space-y-1 block">
            還款年限
            <input
              type="number"
              value={loanYears}
              min={1}
              onChange={(event) => setLoanYears(Math.max(1, Number(event.target.value) || 1))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </label>

          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-700 space-y-1">
            <p>月付款：{formatCurrency(loanCalculation.monthlyPayment)}</p>
            <p>總利息：{formatCurrency(loanCalculation.totalInterest)}</p>
            <p>總支出：{formatCurrency(loanCalculation.totalPayment)}</p>
          </div>
        </div>

        {/* 緊急預備金 */}
        <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
          <h4 className="font-semibold text-gray-800">緊急預備金</h4>
          <label className="text-sm text-gray-600 space-y-1 block">
            每月支出
            <input
              type="number"
              value={monthlyExpense}
              onChange={(event) => setMonthlyExpense(Math.max(0, Number(event.target.value) || 0))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
          <label className="text-sm text-gray-600 space-y-1 block">
            預備月數
            <input
              type="number"
              value={emergencyMonths}
              min={1}
              onChange={(event) => setEmergencyMonths(Math.max(1, Number(event.target.value) || 1))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </label>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
            需要預備金：{formatCurrency(emergencyFund)}
          </div>
        </div>

        {/* 投資報酬預估 */}
        <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
          <h4 className="font-semibold text-gray-800">投資報酬試算</h4>
          <label className="text-sm text-gray-600 space-y-1 block">
            投資金額
            <input
              type="number"
              value={investmentAmount}
              onChange={(event) => setInvestmentAmount(Math.max(0, Number(event.target.value) || 0))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </label>
          <label className="text-sm text-gray-600 space-y-1 block">
            年化報酬率 (%)
            <input
              type="number"
              step="0.1"
              value={expectedReturn}
              onChange={(event) => setExpectedReturn(Number(event.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </label>
          <label className="text-sm text-gray-600 space-y-1 block">
            投資年數
            <input
              type="number"
              min={1}
              value={investmentYears}
              onChange={(event) => setInvestmentYears(Math.max(1, Number(event.target.value) || 1))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </label>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700 space-y-1">
            <p>預估總值：{formatCurrency(investmentResult.futureValue)}</p>
            <p>潛在收益：{formatCurrency(investmentResult.gain)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DebtsPage() {
  const { data: rawDebts, loading, error, setData } = useDebts();
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState<UiDebt | null>(null);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [strategiesComparison, setStrategiesComparison] = useState<StrategiesComparison>(null);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [extraPayment, setExtraPayment] = useState(0);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => new Set());

  const uiDebts = useMemo(() => rawDebts.map(mapDebtRecordToUi), [rawDebts]);

  const totalDebt = useMemo(
    () => uiDebts.reduce((sum, debt) => sum + debt.principal, 0),
    [uiDebts],
  );

  const totalOriginal = useMemo(
    () => uiDebts.reduce((sum, debt) => sum + debt.originalPrincipal, 0),
    [uiDebts],
  );

  const totalMinimumPayment = useMemo(
    () => uiDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
    [uiDebts],
  );

  useEffect(() => {
    if (totalMinimumPayment === 0) {
      return;
    }
    setMonthlyBudget((prev) => (prev === 0 ? Math.ceil(totalMinimumPayment) : prev));
  }, [totalMinimumPayment]);

  const overallProgress = useMemo(() => {
    if (totalOriginal === 0) {
      return 0;
    }
    const paid = totalOriginal - totalDebt;
    return Math.max(0, Math.min(100, Math.round((paid / totalOriginal) * 100)));
  }, [totalOriginal, totalDebt]);

  const averageInterestRate = useMemo(() => {
    if (uiDebts.length === 0 || totalDebt === 0) {
      return 0;
    }
    const weighted = uiDebts.reduce(
      (sum, debt) => sum + debt.principal * debt.interestRate,
      0,
    );
    return Number((weighted / totalDebt).toFixed(1));
  }, [uiDebts, totalDebt]);

  useEffect(() => {
    if (!uiDebts.length || monthlyBudget <= 0) {
      setStrategiesComparison(null);
      setStrategyError(null);
      return;
    }
    try {
      const comparison = compareStrategies(uiDebts, monthlyBudget);
      setStrategiesComparison(comparison);
      setStrategyError(null);
    } catch (err) {
      setStrategiesComparison(null);
      setStrategyError(err instanceof Error ? err.message : '無法計算還款策略');
    }
  }, [uiDebts, monthlyBudget]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const now = new Date();
    const items: NotificationItem[] = [];

    uiDebts.forEach((debt) => {
      if (!debt.dueDate) {
        return;
      }
      const dueDate = new Date(debt.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        items.push({
          id: `${debt.id}-overdue`,
          type: 'payment_due',
          title: `${debt.name} 已逾期`,
          message: `已逾期 ${Math.abs(diffDays)} 天，請盡快繳納最低還款 ${formatCurrency(debt.minimumPayment)}`,
          date: now.toISOString(),
          isRead: false,
          priority: 'high',
        });
      } else if (diffDays <= 3) {
        items.push({
          id: `${debt.id}-due-soon`,
          type: 'payment_due',
          title: `${debt.name} 即將到期`,
          message: `距離繳款日還有 ${diffDays} 天，建議準備 ${formatCurrency(debt.minimumPayment)}`,
          date: now.toISOString(),
          isRead: false,
          priority: 'medium',
        });
      }
    });

    if (items.length === 0) {
      items.push({
        id: 'tip-regular-review',
        type: 'tip',
        title: '理財小提醒',
        message: '定期檢視還款進度並適度調整預算，能加速達成無債目標。',
        date: now.toISOString(),
        isRead: true,
        priority: 'low',
      });
    }

    return items.map((item) => ({
      ...item,
      isRead: item.isRead || readNotificationIds.has(item.id),
    }));
  }, [uiDebts, readNotificationIds]);

  const upcomingSchedule = useMemo(() => {
    const schedule = strategiesComparison?.avalanche?.schedule ?? [];
    return schedule.slice(0, 6);
  }, [strategiesComparison]);

  const handleAddDebt = async (formValues: {
    name: string;
    principal: number;
    interestRate: number;
    minimumPayment: number;
    totalPeriods: number;
    monthlyDueDay: number;
    type: string;
    subType: string;
    dueDate: string | null;
  }) => {
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
      name: formValues.name,
      balance: formValues.principal,
      original_amount: formValues.principal,
      interest_rate: formValues.interestRate,
      minimum_payment: formValues.minimumPayment,
      due_date: formValues.dueDate,
      debt_type: TYPE_CODE_BY_LABEL[formValues.type] ?? 'other',
      status: 'active',
      notes: formValues.subType || null,
    };

    const created = await createDebt(payload);
    setData((prev) => [created, ...prev]);
    setShowAddDebt(false);
  };

  const handleEditDebt = async (formValues: {
    id: string;
    name: string;
    principal: number;
    interestRate: number;
    minimumPayment: number;
    totalPeriods: number;
    monthlyDueDay: number;
    type: string;
    subType: string;
    dueDate: string | null;
  }) => {
    const existing = rawDebts.find((debt) => debt.id === formValues.id);
    const patch: Partial<Debt> = {
      name: formValues.name,
      balance: formValues.principal,
      interest_rate: formValues.interestRate,
      minimum_payment: formValues.minimumPayment,
      due_date: formValues.dueDate,
      debt_type: TYPE_CODE_BY_LABEL[formValues.type] ?? existing?.debt_type ?? 'other',
      original_amount: existing?.original_amount ?? formValues.principal,
      notes: formValues.subType || null,
    };

    const updated = await updateDebt(formValues.id, patch);
    setData((prev) => prev.map((debt) => (debt.id === formValues.id ? updated : debt)));
    setEditingDebt(null);
  };

  const handleDeleteDebt = async (debtId: string) => {
    await removeDebt(debtId);
    setData((prev) => prev.filter((debt) => debt.id !== debtId));
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="text-gray-600">載入債務資料中...</div>
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : '載入債務資料時發生錯誤';
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* 概覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>總債務</span>
            <DollarSign className="text-purple-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalDebt)}</p>
          <p className="text-xs text-gray-500 mt-2">原始金額：{formatCurrency(totalOriginal)}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>月最低還款</span>
            <TrendingDown className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalMinimumPayment)}</p>
          <p className="text-xs text-gray-500 mt-2">預設月預算會以此金額起算</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>平均利率</span>
            <Target className="text-orange-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-800">{averageInterestRate}%</p>
          <p className="text-xs text-gray-500 mt-2">依債務餘額加權平均</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>還款進度</span>
            <Flag className="text-green-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-800">{overallProgress}%</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 通知系統 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Bell className="mr-2 text-indigo-500" size={20} />
            通知與提醒
          </h3>
          <span className="text-sm text-gray-500">
            {notifications.filter((item) => !item.isRead).length} 則未讀
          </span>
        </div>

        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-colors ${
                item.priority === 'high'
                  ? 'bg-red-50 border-red-200'
                  : item.priority === 'medium'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                </div>
                {!item.isRead && (
                  <button
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                    onClick={() =>
                      setReadNotificationIds((prev) => {
                        const next = new Set(prev);
                        next.add(item.id);
                        return next;
                      })
                    }
                  >
                    標記已讀
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 債務列表 */}
      <DebtsList
        debts={uiDebts}
        debtTypes={DEBT_TYPES}
        onDeleteDebt={handleDeleteDebt}
        onShowAddForm={() => setShowAddDebt(true)}
        onShowEditForm={(debt) => setEditingDebt(debt)}
      />

      {/* 還款策略 */}
      <div className="space-y-4">
        {strategyError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {strategyError}
          </div>
        ) : (
          <PaymentStrategy
            debts={uiDebts}
            monthlyBudget={monthlyBudget}
            setMonthlyBudget={setMonthlyBudget}
            strategiesComparison={strategiesComparison}
            extraPayment={extraPayment}
            setExtraPayment={setExtraPayment}
            calculateExtraPaymentEffect={calculateExtraPaymentEffect}
            onAddDebt={() => setShowAddDebt(true)}
          />
        )}
      </div>

      {/* 還款計劃表 */}
      <PaymentPlan
        debts={uiDebts}
        monthlyBudget={monthlyBudget}
        extraPayment={extraPayment}
        strategiesComparison={strategiesComparison}
      />

      {/* 進度追蹤與目標設定 */}
      <GoalSection
        totalDebt={totalDebt}
        overallProgress={overallProgress}
        projectedMonths={strategiesComparison?.avalanche?.months ?? null}
        monthlyBudget={monthlyBudget}
        extraPayment={extraPayment}
      />

      {/* 預估還款排程 */}
      {upcomingSchedule.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
            <CalendarIcon className="mr-2 text-blue-600" size={20} />
            未來六個月還款預覽
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingSchedule.map((month) => (
              <div key={month.monthIndex} className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  {new Date(month.date).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'short',
                  })}
                </p>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  本月付款 {formatCurrency(month.totalPaid)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  利息 {formatCurrency(month.totalInterest)}，剩餘 {formatCurrency(month.remainingBalance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 財務工具 */}
      <FinancialTools totalDebt={totalDebt} monthlyBudget={monthlyBudget} />

      {showAddDebt && (
        <AddDebtForm
          onClose={() => setShowAddDebt(false)}
          onAddDebt={handleAddDebt}
          debtTypes={DEBT_TYPES}
        />
      )}

      {editingDebt && (
        <EditDebtForm
          debt={editingDebt}
          onClose={() => setEditingDebt(null)}
          onEditDebt={handleEditDebt}
          debtTypes={DEBT_TYPES}
        />
      )}
    </div>
  );
}
