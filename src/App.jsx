import { useState, useEffect } from 'react';
import {
  TrendingDown,
  Bell,
  BarChart3,
  DollarSign,
  Settings,
  User,
  LogOut,
  Plus,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AddDebtForm from './components/AddDebtForm';
import EditDebtForm from './components/EditDebtForm';
import DebtsList from './components/DebtsList';
import PaymentStrategy from './components/PaymentStrategy';
import PaymentPlan from './components/PaymentPlan';
import { compareStrategies, calculateExtraPaymentEffect } from './algorithms/debtStrategies';
import {
  ApiError,
  login as loginApi,
  register as registerApi,
  fetchCurrentUser,
  fetchDebts,
  createDebt as createDebtApi,
  updateDebt as updateDebtApi,
  deleteDebt as deleteDebtApi,
  updateMembership as updateMembershipApi,
} from './api/client';

const STORAGE_TOKEN_KEY = 'debtwise_token';

const BASE_ACHIEVEMENTS = [
  {
    id: 1,
    title: '新手上路',
    description: '完成第一次債務記錄',
    icon: '🎯',
  },
  {
    id: 2,
    title: '策略規劃師',
    description: '選擇第一個還款策略',
    icon: '🧠',
  },
  {
    id: 3,
    title: '債務終結者',
    description: '完全清償第一筆債務',
    icon: '🏆',
  },
];

const DEBT_TYPES = {
  信用卡: {
    icon: '💳',
    subTypes: ['循環信用', '信用卡分期', '現金卡', '預借現金'],
  },
  房貸: {
    icon: '🏠',
    subTypes: ['指數型房貸', '固定型房貸', '理財型房貸', '青年安心成家貸款', '房屋修繕貸款'],
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
    subTypes: ['信用貸款', '小額信貸', '代償性貸款', '整合性貸款'],
  },
  投資: {
    icon: '📈',
    subTypes: ['融資', '股票質借', '期貨保證金', '外匯保證金'],
  },
  企業經營: {
    icon: '🏢',
    subTypes: ['企業貸款', '週轉金貸款', '設備貸款', '創業貸款'],
  },
  其他: {
    icon: '📋',
    subTypes: ['民間借貸', '親友借款', '當鋪借款', '標會'],
  },
};

const TYPE_COLOR_MAP = {
  信用卡: 'red',
  房貸: 'blue',
  車貸: 'green',
  學貸: 'yellow',
  個人信貸: 'purple',
  投資: 'pink',
  企業經營: 'indigo',
  其他: 'gray',
};

const TYPE_CODE_BY_LABEL = {
  信用卡: 'credit_card',
  房貸: 'mortgage',
  車貸: 'auto',
  學貸: 'student',
  個人信貸: 'loan',
  投資: 'other',
  企業經營: 'other',
  其他: 'other',
};

const LABEL_BY_TYPE = {
  credit_card: '信用卡',
  mortgage: '房貸',
  auto: '車貸',
  student: '學貸',
  loan: '個人信貸',
  other: '其他',
};

function mapApiTypeToLabel(type) {
  return LABEL_BY_TYPE[type] || '其他';
}

function mapLabelToApiType(label) {
  return TYPE_CODE_BY_LABEL[label] || 'other';
}

function extractDatePart(value) {
  if (!value) {
    return '';
  }
  return value.split('T')[0];
}

function getMonthlyDueDayFromDate(value) {
  const datePart = extractDatePart(value);
  if (!datePart) {
    return 1;
  }
  const parts = datePart.split('-');
  return Number(parts[2]) || 1;
}

function mapApiDebtToUi(debt) {
  const typeLabel = mapApiTypeToLabel(debt.type);
  const datePart = extractDatePart(debt.dueDate);
  return {
    id: debt.id,
    name: debt.name,
    principal: debt.balance,
    originalPrincipal: debt.principal,
    interestRate: debt.apr,
    minimumPayment: debt.minimumPayment,
    totalPeriods: debt.totalPeriods ?? 0,
    remainingPeriods: debt.remainingPeriods ?? 0,
    monthlyDueDay: debt.monthlyDueDay ?? getMonthlyDueDayFromDate(debt.dueDate),
    dueDate: datePart,
    type: typeLabel,
    typeCode: debt.type,
    subType: debt.subType || '',
    color: TYPE_COLOR_MAP[typeLabel] || 'gray',
    createdAt: debt.createdAt,
    updatedAt: debt.updatedAt,
    lastPaymentAt: debt.lastPaymentAt,
  };
}

const DebtWiseAI = () => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState(null);
  const [debts, setDebts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [extraPayment, setExtraPayment] = useState(0);
  const [strategiesComparison, setStrategiesComparison] = useState(null);
  const [monthlyBudget, setMonthlyBudget] = useState(30000);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [achievements, setAchievements] = useState(() =>
    BASE_ACHIEVEMENTS.map((item) => ({ ...item, isUnlocked: false, unlockedDate: null }))
  );
  const [_showNotifications, setShowNotifications] = useState(false);
  const [_showAchievement, setShowAchievement] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [initializing, setInitializing] = useState(Boolean(token));

  const debtTypes = DEBT_TYPES;

  const refreshAchievements = (debtList, { showUnlockToast = false } = {}) => {
    let unlockedAchievement = null;
    setAchievements((prev) => {
      const updated = prev.map((achievement) => {
        if (achievement.id === 1) {
          if (debtList.length > 0) {
            const next = {
              ...achievement,
              isUnlocked: true,
              unlockedDate: achievement.unlockedDate || new Date().toISOString(),
            };
            if (showUnlockToast && !achievement.isUnlocked) {
              unlockedAchievement = next;
            }
            return next;
          }
          return { ...achievement, isUnlocked: false, unlockedDate: null };
        }
        if (achievement.id === 3) {
          const hasCleared = debtList.some((debt) => debt.principal <= 0);
          if (hasCleared) {
            const next = {
              ...achievement,
              isUnlocked: true,
              unlockedDate: achievement.unlockedDate || new Date().toISOString(),
            };
            if (showUnlockToast && !achievement.isUnlocked) {
              unlockedAchievement = unlockedAchievement || next;
            }
            return next;
          }
          return { ...achievement, isUnlocked: false, unlockedDate: null };
        }
        return achievement;
      });
      return updated;
    });
    if (showUnlockToast && unlockedAchievement) {
      setShowAchievement(unlockedAchievement);
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    let cancelled = false;
    setInitializing(true);
    setAuthError('');
    (async () => {
      try {
        const [userResponse, debtsResponse] = await Promise.all([
          fetchCurrentUser(token),
          fetchDebts(token),
        ]);
        if (cancelled) {
          return;
        }
        const mappedDebts = (debtsResponse?.debts || []).map((debt) => mapApiDebtToUi(debt));
        setCurrentUser(userResponse.user);
        setIsPremium(userResponse.user.membership === 'premium');
        setDebts(mappedDebts);
        refreshAchievements(mappedDebts);
        setActiveTab('dashboard');
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to restore session', error);
          setAuthError(error?.message || '驗證失敗，請重新登入');
          setToken(null);
          setCurrentUser(null);
          setDebts([]);
          setIsPremium(false);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (debts.length === 0 || monthlyBudget <= 0) {
      setStrategiesComparison(null);
      return;
    }
    try {
      const comparison = compareStrategies(debts, monthlyBudget);
      setStrategiesComparison(comparison);
    } catch (error) {
      console.error('策略計算錯誤:', error);
    }
  }, [debts, monthlyBudget]);

  useEffect(() => {
    if (debts.length === 0) {
      setPaymentHistory([]);
      return;
    }
    const totalBalance = debts.reduce((sum, debt) => sum + debt.principal, 0);
    const totalPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const history = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthlyPaid = Math.max(totalPayment + extraPayment, 0);
      const interestPaid = Math.round(monthlyPaid * 0.2);
      const principalPaid = Math.max(monthlyPaid - interestPaid, 0);
      const remainingBalance = Math.max(totalBalance - principalPaid * (index + 1), 0);
      return {
        month,
        totalPaid: monthlyPaid,
        interestPaid,
        principalPaid,
        remainingBalance,
      };
    });
    setPaymentHistory(history);
  }, [debts, extraPayment]);

  useEffect(() => {
    if (debts.length === 0) {
      setNotifications([]);
      return;
    }
    const now = new Date();
    const items = [];
    debts.forEach((debt) => {
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
          message: `已逾期 ${Math.abs(diffDays)} 天，請盡快繳納最低還款 ${debt.minimumPayment.toLocaleString()} 元`,
          date: new Date().toISOString(),
          isRead: false,
          priority: 'high',
        });
      } else if (diffDays <= 3) {
        items.push({
          id: `${debt.id}-due-soon`,
          type: 'payment_due',
          title: `${debt.name} 還款提醒`,
          message: `還有 ${diffDays} 天到期，建議準備 ${debt.minimumPayment.toLocaleString()} 元`,
          date: new Date().toISOString(),
          isRead: false,
          priority: 'medium',
        });
      }
    });
    if (items.length === 0) {
      items.push({
        id: 'tip-basic',
        type: 'tip',
        title: '理財提醒',
        message: '定期檢視債務狀況，適度調整還款策略可以加速清償進度。',
        date: new Date().toISOString(),
        isRead: true,
        priority: 'low',
      });
    }
    setNotifications(items);
  }, [debts]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    if (!authForm.email || !authForm.password || (authMode === 'register' && !authForm.name)) {
      setAuthError('請完整填寫表單資訊');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const result = await loginApi({ email: authForm.email, password: authForm.password });
        setToken(result.token);
        setCurrentUser(result.user);
        setIsPremium(result.user.membership === 'premium');
      } else {
        const result = await registerApi({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        });
        setToken(result.token);
        setCurrentUser(result.user);
        setIsPremium(result.user.membership === 'premium');
      }
    } catch (error) {
      setAuthError(error?.message || '驗證失敗，請稍後再試');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoAccount = {
      name: 'DebtWise Demo',
      email: 'demo@debtwise.ai',
      password: 'DemoPass123!',
    };
    setAuthError('');
    setAuthLoading(true);
    try {
      let result;
      try {
        result = await registerApi(demoAccount);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          result = await loginApi({ email: demoAccount.email, password: demoAccount.password });
        } else {
          throw error;
        }
      }
      setToken(result.token);
      setCurrentUser(result.user);
      setIsPremium(result.user.membership === 'premium');
    } catch (error) {
      setAuthError(error?.message || '無法啟動演示模式，請稍後再試');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddDebt = async (formValues) => {
    if (!token) {
      throw new Error('請先登入後再新增債務');
    }
    const payload = {
      name: formValues.name,
      principal: formValues.principal,
      apr: formValues.interestRate,
      minimumPayment: formValues.minimumPayment,
      dueDate: formValues.dueDate,
      type: mapLabelToApiType(formValues.type),
    };
    const response = await createDebtApi(token, payload);
    const createdDebt = {
      ...mapApiDebtToUi(response.debt),
      subType: formValues.subType || '',
      totalPeriods: formValues.totalPeriods || 0,
      remainingPeriods: formValues.totalPeriods || 0,
      monthlyDueDay: formValues.monthlyDueDay,
    };
    createdDebt.type = formValues.type;
    createdDebt.color = TYPE_COLOR_MAP[formValues.type] || createdDebt.color;
    const nextDebts = [...debts, createdDebt];
    setDebts(nextDebts);
    refreshAchievements(nextDebts, { showUnlockToast: true });
  };

  const handleEditDebt = async (formValues) => {
    if (!token) {
      throw new Error('請先登入後再編輯債務');
    }
    const payload = {
      name: formValues.name,
      apr: formValues.interestRate,
      minimumPayment: formValues.minimumPayment,
      dueDate: formValues.dueDate,
      type: mapLabelToApiType(formValues.type),
      balance: formValues.principal,
    };
    const response = await updateDebtApi(token, formValues.id, payload);
    const updatedDebt = {
      ...mapApiDebtToUi(response.debt),
      subType: formValues.subType || '',
      totalPeriods: formValues.totalPeriods || 0,
      remainingPeriods: formValues.totalPeriods || 0,
      monthlyDueDay: formValues.monthlyDueDay,
    };
    updatedDebt.type = formValues.type;
    updatedDebt.color = TYPE_COLOR_MAP[formValues.type] || updatedDebt.color;
    const nextDebts = debts.map((debt) => (debt.id === formValues.id ? updatedDebt : debt));
    setDebts(nextDebts);
    refreshAchievements(nextDebts);
  };

  const handleDeleteDebt = async (debtId) => {
    if (!token) {
      return;
    }
    try {
      await deleteDebtApi(token, debtId);
      const nextDebts = debts.filter((debt) => debt.id !== debtId);
      setDebts(nextDebts);
      refreshAchievements(nextDebts);
    } catch (error) {
      console.error('刪除債務失敗', error);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setDebts([]);
    setIsPremium(false);
    setNotifications([]);
    setStrategiesComparison(null);
    setAchievements(BASE_ACHIEVEMENTS.map((item) => ({ ...item, isUnlocked: false, unlockedDate: null })));
    setActiveTab('dashboard');
    setAuthMode('login');
    setAuthForm({ name: '', email: '', password: '' });
  };

  const handleToggleMembership = async () => {
    if (!token || !currentUser) {
      return;
    }
    const nextMembership = isPremium ? 'free' : 'premium';
    try {
      const response = await updateMembershipApi(token, nextMembership);
      const updatedUser = response?.user || { ...currentUser, membership: nextMembership };
      setCurrentUser(updatedUser);
      setIsPremium(updatedUser.membership === 'premium');
    } catch (error) {
      console.error('更新會員狀態失敗', error);
    }
  };

  const getTotalDebt = () => debts.reduce((sum, debt) => sum + debt.principal, 0);

  const getTotalMonthlyPayment = () => debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

  const getAverageInterestRate = () => {
    if (debts.length === 0) return 0;
    const totalWeighted = debts.reduce((sum, debt) => sum + debt.principal * debt.interestRate, 0);
    const totalDebt = getTotalDebt();
    return totalDebt === 0 ? 0 : (totalWeighted / totalDebt).toFixed(1);
  };

  const getPaymentProgress = (debt) => {
    if (!debt.originalPrincipal) return 0;
    const paid = debt.originalPrincipal - debt.principal;
    return Math.max(Math.round((paid / debt.originalPrincipal) * 100), 0);
  };

  const getOverallProgress = () => {
    if (debts.length === 0) return 0;
    const totalOriginal = debts.reduce((sum, debt) => sum + debt.originalPrincipal, 0);
    if (totalOriginal === 0) return 0;
    const totalPaid = debts.reduce((sum, debt) => sum + (debt.originalPrincipal - debt.principal), 0);
    return Math.max(Math.round((totalPaid / totalOriginal) * 100), 0);
  };

  const isComingSoon = (monthlyDueDay) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let nextDueDate = new Date(currentYear, currentMonth, monthlyDueDay);
    if (nextDueDate <= today) {
      nextDueDate = new Date(currentYear, currentMonth + 1, monthlyDueDay);
    }
    const diffTime = nextDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const getNextDueDate = (monthlyDueDay) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let nextDueDate = new Date(currentYear, currentMonth, monthlyDueDay);
    if (nextDueDate <= today) {
      nextDueDate = new Date(currentYear, currentMonth + 1, monthlyDueDay);
    }
    return nextDueDate.toLocaleDateString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const LoginForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            DebtWise AI
          </h1>
          <p className="text-gray-600">智能債務管理助手</p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input
                type="text"
                value={authForm.name}
                onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="您的名字"
                disabled={authLoading}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="example@email.com"
              disabled={authLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="至少 8 個字元"
              disabled={authLoading}
            />
          </div>

          {authError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{authError}</div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {authLoading ? '處理中...' : authMode === 'login' ? '登入' : '建立帳號'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleDemoLogin}
            disabled={authLoading}
            className="w-full border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors backdrop-blur-sm disabled:opacity-70"
          >
            啟動演示模式
          </button>
          <p className="text-sm text-center text-gray-600">
            {authMode === 'login' ? '還沒有帳號？' : '已經有帳號了？'}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              className="ml-2 text-purple-600 font-medium"
            >
              {authMode === 'login' ? '立即註冊' : '前往登入'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          👋 你好，{currentUser?.name || currentUser?.email}
        </h1>
        <p className="text-gray-600">讓我們一起管理您的債務，邁向財務自由！</p>
      </div>

      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">債務總覽</h2>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <BarChart3 size={24} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1">總債務</p>
            <p className="text-2xl font-bold">${getTotalDebt().toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1">月還款</p>
            <p className="text-2xl font-bold">${getTotalMonthlyPayment().toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1">債務項目</p>
            <p className="text-2xl font-bold">{debts.length}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/80">還款進度</span>
            <span className="font-bold">{getOverallProgress()}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <TrendingDown className="mr-2 text-blue-500" size={20} />
          還款趨勢
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paymentHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              <Line type="monotone" dataKey="remainingBalance" stroke="#8884d8" strokeWidth={2} name="剩餘餘額" />
              <Line type="monotone" dataKey="totalPaid" stroke="#82ca9d" strokeWidth={2} name="月付款" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Clock className="mr-2 text-orange-500" size={20} />
            近期繳款提醒
          </h3>
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
            {debts.filter((debt) => isComingSoon(debt.monthlyDueDay)).length} 項即將到期
          </span>
        </div>

        <div className="space-y-3">
          {debts
            .filter((debt) => isComingSoon(debt.monthlyDueDay))
            .slice(0, 3)
            .map((debt) => (
              <div
                key={debt.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100"
              >
                <div className="flex items-center">
                  <div className={`w-1 h-12 bg-${debt.color}-500 rounded-full mr-4`} />
                  <div>
                    <p className="font-medium text-gray-800 flex items-center">
                      <span className="mr-2">{debtTypes[debt.type]?.icon || '💳'}</span>
                      {debt.name}
                    </p>
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      下次繳款：{getNextDueDate(debt.monthlyDueDay)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">${debt.minimumPayment.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{debt.interestRate}%</p>
                </div>
              </div>
            ))}

          {debts.filter((debt) => isComingSoon(debt.monthlyDueDay)).length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-gray-500">近期沒有需要繳款的債務</p>
              <p className="text-sm text-gray-400">您的財務狀況良好！</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowAddDebt(true)}
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
        >
          <div className="text-4xl mb-3">💳</div>
          <h3 className="font-bold text-gray-800 mb-1">新增債務</h3>
          <p className="text-sm text-gray-600">快速添加新的債務項目</p>
        </button>

        <button
          onClick={() => setActiveTab('strategy')}
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
        >
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="font-bold text-gray-800 mb-1">還款策略</h3>
          <p className="text-sm text-gray-600">查看AI推薦的還款計畫</p>
        </button>
      </div>
    </div>
  );

  const ProgressTracker = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">進度追蹤</h2>

      <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-xl font-bold mb-4">還款進度總覽</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-white/80 text-sm mb-1">整體進度</p>
            <p className="text-3xl font-bold">{getOverallProgress()}%</p>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">已還金額</p>
            <p className="text-3xl font-bold">
              ${debts.reduce((sum, debt) => sum + (debt.originalPrincipal - debt.principal), 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/80">距離目標</span>
            <span className="font-bold">${debts.reduce((sum, debt) => sum + debt.principal, 0).toLocaleString()}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-emerald-300 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {debts.map((debt) => (
          <div key={debt.id} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-800">{debt.name}</h3>
              <span className="text-sm text-gray-500">{debtTypes[debt.type]?.icon || '💳'} {debt.type}</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>進度</span>
                <span>{getPaymentProgress(debt)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                  style={{ width: `${getPaymentProgress(debt)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>餘額：${debt.principal.toLocaleString()}</p>
              <p>年利率：{debt.interestRate}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!token || !currentUser) {
    if (initializing) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">載入中，請稍候…</p>
          </div>
        </div>
      );
    }
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                DW
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">DebtWise AI</h1>
                <p className="text-sm text-gray-500">智能債務規劃中心</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(true)}
                className="text-gray-600 hover:text-purple-600 transition-colors relative"
              >
                <Bell size={20} />
                {notifications.filter((item) => !item.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications.filter((item) => !item.isRead).length}
                  </span>
                )}
              </button>
              <button
                onClick={handleToggleMembership}
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Settings size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="text-white" size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700">{currentUser?.name || currentUser?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'debts' && (
          <DebtsList
            debts={debts}
            debtTypes={debtTypes}
            onDeleteDebt={handleDeleteDebt}
            onShowAddForm={() => setShowAddDebt(true)}
            onShowEditForm={(debt) => setEditingDebt(debt)}
          />
        )}
        {activeTab === 'strategy' && (
          <PaymentStrategy
            debts={debts}
            monthlyBudget={monthlyBudget}
            setMonthlyBudget={setMonthlyBudget}
            strategiesComparison={strategiesComparison}
            extraPayment={extraPayment}
            setExtraPayment={setExtraPayment}
            calculateExtraPaymentEffect={calculateExtraPaymentEffect}
            onAddDebt={() => setShowAddDebt(true)}
          />
        )}
        {activeTab === 'progress' && <ProgressTracker />}
        {activeTab === 'plan' && (
          <PaymentPlan
            debts={debts}
            monthlyBudget={monthlyBudget}
            extraPayment={extraPayment}
            strategiesComparison={strategiesComparison}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-2 py-2 z-30">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {[
            { id: 'dashboard', name: '總覽', emoji: '🏠' },
            { id: 'debts', name: '債務', emoji: '💳' },
            { id: 'strategy', name: '策略', emoji: '🎯' },
            { id: 'plan', name: '計劃', emoji: '📅' },
            { id: 'progress', name: '進度', emoji: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-300 relative ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-110'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <span className="text-lg mb-1">{tab.emoji}</span>
              <span className="text-xs font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </nav>

      <button
        onClick={() => setShowAddDebt(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </button>

      {showAddDebt && (
        <AddDebtForm
          onClose={() => setShowAddDebt(false)}
          onAddDebt={handleAddDebt}
          debtTypes={debtTypes}
        />
      )}

      {editingDebt && (
        <EditDebtForm
          debt={editingDebt}
          onClose={() => setEditingDebt(null)}
          onEditDebt={handleEditDebt}
          debtTypes={debtTypes}
        />
      )}
    </div>
  );
};

export default DebtWiseAI;
