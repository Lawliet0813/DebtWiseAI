import { useState, useEffect } from 'react';
import { TrendingDown, Bell, BarChart3, DollarSign, Settings, User, LogOut, Plus, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AddDebtForm from './components/AddDebtForm';
import DebtsList from './components/DebtsList';
import PaymentStrategy from './components/PaymentStrategy';
import PaymentPlan from './components/PaymentPlan';
import { compareStrategies, calculateExtraPaymentEffect } from './algorithms/debtStrategies';

const DebtWiseAI = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [debts, setDebts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [extraPayment, setExtraPayment] = useState(0);
  const [strategiesComparison, setStrategiesComparison] = useState(null);
  const [monthlyBudget, setMonthlyBudget] = useState(30000);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [_showNotifications, setShowNotifications] = useState(false);
  const [_showAchievement, setShowAchievement] = useState(null);

  // 債務類型定義
  const debtTypes = {
    '信用卡': {
      icon: '💳',
      subTypes: [
        '循環信用',
        '信用卡分期',
        '現金卡',
        '預借現金'
      ]
    },
    '房貸': {
      icon: '🏠',
      subTypes: [
        '指數型房貸',
        '固定型房貸',
        '理財型房貸',
        '青年安心成家貸款',
        '房屋修繕貸款'
      ]
    },
    '車貸': {
      icon: '🚗',
      subTypes: [
        '新車貸款',
        '中古車貸款',
        '機車貸款',
        '商用車貸款'
      ]
    },
    '學貸': {
      icon: '🎓',
      subTypes: [
        '政府就學貸款',
        '私校學費貸款',
        '留學貸款',
        '在職進修貸款'
      ]
    },
    '個人信貸': {
      icon: '💰',
      subTypes: [
        '信用貸款',
        '小額信貸',
        '代償性貸款',
        '整合性貸款'
      ]
    },
    '投資': {
      icon: '📈',
      subTypes: [
        '融資',
        '股票質借',
        '期貨保證金',
        '外匯保證金'
      ]
    },
    '企業經營': {
      icon: '🏢',
      subTypes: [
        '企業貸款',
        '週轉金貸款',
        '設備貸款',
        '創業貸款'
      ]
    },
    '其他': {
      icon: '📋',
      subTypes: [
        '民間借貸',
        '親友借款',
        '當鋪借款',
        '標會'
      ]
    }
  };

  // 初始化示例數據
  useEffect(() => {
    const sampleDebts = [
      {
        id: 1,
        name: '中信信用卡',
        principal: 50000,
        originalPrincipal: 80000,
        interestRate: 18.5,
        minimumPayment: 2000,
        totalPeriods: 0,
        remainingPeriods: 0,
        dueDate: '2025-10-15',
        type: '信用卡',
        subType: '循環信用',
        color: 'red',
        monthlyDueDay: 15
      },
      {
        id: 2,
        name: '房屋貸款',
        principal: 2000000,
        originalPrincipal: 2500000,
        interestRate: 2.1,
        minimumPayment: 15000,
        totalPeriods: 240,
        remainingPeriods: 180,
        dueDate: '2025-10-01',
        type: '房貸',
        subType: '指數型房貸',
        color: 'blue',
        monthlyDueDay: 1
      },
      {
        id: 3,
        name: '汽車貸款',
        principal: 300000,
        originalPrincipal: 500000,
        interestRate: 4.8,
        minimumPayment: 8000,
        totalPeriods: 60,
        remainingPeriods: 36,
        dueDate: '2025-10-05',
        type: '車貸',
        subType: '新車貸款',
        color: 'green',
        monthlyDueDay: 5
      },
      {
        id: 4,
        name: '就學貸款',
        principal: 120000,
        originalPrincipal: 150000,
        interestRate: 1.15,
        minimumPayment: 3000,
        totalPeriods: 60,
        remainingPeriods: 48,
        dueDate: '2025-10-20',
        type: '學貸',
        subType: '政府就學貸款',
        color: 'yellow',
        monthlyDueDay: 20
      }
    ];
    
    setDebts(sampleDebts);
    setCurrentUser({ name: '小明', email: 'user@example.com' });
    
    // 初始化成就系統
    setAchievements([
      {
        id: 1,
        title: '新手上路',
        description: '完成第一次債務記錄',
        icon: '🎯',
        isUnlocked: true,
        unlockedDate: '2025-09-15'
      },
      {
        id: 2,
        title: '策略規劃師',
        description: '選擇第一個還款策略',
        icon: '🧠',
        isUnlocked: false
      },
      {
        id: 3,
        title: '債務終結者',
        description: '完全清償第一筆債務',
        icon: '🏆',
        isUnlocked: false
      }
    ]);

    // 初始化通知
    setNotifications([
      {
        id: 1,
        type: 'payment_due',
        title: '還款提醒',
        message: '中信信用卡將於3天後到期，請準備還款 $2,000',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        isRead: false,
        priority: 'high'
      },
      {
        id: 2,
        type: 'tip',
        title: '理財小貼士',
        message: '每月固定日期檢視債務狀況，養成良好的財務習慣',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        isRead: true,
        priority: 'low'
      }
    ]);

    // 初始化模擬還款歷史數據
    const samplePaymentHistory = Array.from({ length: 12 }, (_, i) => ({
      month: `${2024}-${String(i + 1).padStart(2, '0')}`,
      totalPaid: 28000 + Math.random() * 5000,
      interestPaid: 3000 + Math.random() * 1000,
      principalPaid: 25000 + Math.random() * 4000,
      remainingBalance: 2470000 - (i * 25000)
    }));
    setPaymentHistory(samplePaymentHistory);
  }, []);

  // 新增債務功能
  const handleAddDebt = async (newDebt) => {
    setDebts(prev => [...prev, newDebt]);
    
    // 觸發成就
    if (achievements.find(a => a.id === 1 && !a.isUnlocked)) {
      setAchievements(prev => prev.map(a => 
        a.id === 1 ? { ...a, isUnlocked: true, unlockedDate: new Date().toISOString() } : a
      ));
      setShowAchievement(achievements.find(a => a.id === 1));
    }
  };

  // 刪除債務
  const handleDeleteDebt = (debtId) => {
    setDebts(prev => prev.filter(debt => debt.id !== debtId));
  };

  // 計算策略比較
  useEffect(() => {
    if (debts.length > 0 && monthlyBudget > 0) {
      try {
        const comparison = compareStrategies(debts, monthlyBudget);
        setStrategiesComparison(comparison);
      } catch (error) {
        console.error('策略計算錯誤:', error);
      }
    }
  }, [debts, monthlyBudget]);

  // 計算總債務
  const getTotalDebt = () => debts.reduce((sum, debt) => sum + debt.principal, 0);

  // 計算月還款總額
  const getTotalMonthlyPayment = () => debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

  // 計算平均利率
  const getAverageInterestRate = () => {
    if (debts.length === 0) return 0;
    const totalWeighted = debts.reduce((sum, debt) => sum + (debt.principal * debt.interestRate), 0);
    return (totalWeighted / getTotalDebt()).toFixed(1);
  };

  // 計算還款進度百分比
  const getPaymentProgress = (debt) => {
    const paid = debt.originalPrincipal - debt.principal;
    return Math.round((paid / debt.originalPrincipal) * 100);
  };

  // 計算總體還款進度
  const getOverallProgress = () => {
    if (debts.length === 0) return 0;
    const totalOriginal = debts.reduce((sum, debt) => sum + debt.originalPrincipal, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + (debt.originalPrincipal - debt.principal), 0);
    return Math.round((totalPaid / totalOriginal) * 100);
  };

  // 檢查是否即將到期
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

  // 獲取下次繳款日期
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
      weekday: 'short'
    });
  };

  // 登入組件
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
        
        <div className="space-y-4">
          <button
            onClick={() => setCurrentUser({ name: '小明', email: 'demo@example.com' })}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            開始使用 (演示模式)
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button className="border border-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors backdrop-blur-sm">
              Google 登入
            </button>
            <button className="border border-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors backdrop-blur-sm">
              Apple ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 儀表板
  const Dashboard = () => (
    <div className="space-y-6">
      {/* 個人化歡迎 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          👋 你好，{currentUser.name}
        </h1>
        <p className="text-gray-600">讓我們一起管理您的債務，邁向財務自由！</p>
      </div>

      {/* 債務總覽卡片 */}
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
            <p className="text-2xl font-bold">
              ${getTotalDebt().toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1">月還款</p>
            <p className="text-2xl font-bold">
              ${getTotalMonthlyPayment().toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1">債務項目</p>
            <p className="text-2xl font-bold">{debts.length}</p>
          </div>
        </div>
        
        {/* 總體進度條 */}
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

      {/* 還款趨勢圖表 */}
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

      {/* 即將到期債務 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Clock className="mr-2 text-orange-500" size={20} />
            近期繳款提醒
          </h3>
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
            {debts.filter(debt => isComingSoon(debt.monthlyDueDay)).length} 項即將到期
          </span>
        </div>
        
        <div className="space-y-3">
          {debts.filter(debt => isComingSoon(debt.monthlyDueDay)).slice(0, 3).map(debt => (
            <div key={debt.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
              <div className="flex items-center">
                <div className={`w-1 h-12 bg-${debt.color}-500 rounded-full mr-4`} />
                <div>
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="mr-2">{debtTypes[debt.type]?.icon}</span>
                    {debt.name}
                  </p>
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    下次繳款：{getNextDueDate(debt.monthlyDueDay)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">
                  ${debt.minimumPayment.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">{debt.interestRate}%</p>
              </div>
            </div>
          ))}
          
          {debts.filter(debt => isComingSoon(debt.monthlyDueDay)).length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-gray-500">近期沒有需要繳款的債務</p>
              <p className="text-sm text-gray-400">您的財務狀況良好！</p>
            </div>
          )}
        </div>
      </div>

      {/* 快速操作 */}
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

  // 進度追蹤頁面
  const ProgressTracker = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">進度追蹤</h2>

      {/* 總體進度概覽 */}
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
        <div className="w-full bg-white/20 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getOverallProgress()}%` }}
          />
        </div>
      </div>

      {/* 個別債務進度 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">個別債務進度</h3>
        {debts.map(debt => (
          <div key={debt.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{debtTypes[debt.type]?.icon}</span>
                <div>
                  <h4 className="font-bold text-gray-800">{debt.name}</h4>
                  <p className="text-sm text-gray-600">{debt.subType}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{getPaymentProgress(debt)}%</p>
                <p className="text-sm text-gray-600">已完成</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">原始金額</p>
                <p className="font-bold">${debt.originalPrincipal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">剩餘金額</p>
                <p className="font-bold">${debt.principal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">已還金額</p>
                <p className="font-bold text-green-600">
                  ${(debt.originalPrincipal - debt.principal).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-gradient-to-r from-${debt.color}-400 to-${debt.color}-500 h-3 rounded-full transition-all duration-500`}
                style={{ width: `${getPaymentProgress(debt)}%` }}
              />
            </div>
          </div>
        ))}

        {debts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">尚無進度可追蹤</h3>
            <p className="text-gray-600 mb-6">新增債務資料後即可開始追蹤還款進度</p>
            <button
              onClick={() => setShowAddDebt(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            >
              新增債務
            </button>
          </div>
        )}
      </div>

      {/* 月付款歷史圖表 */}
      {paymentHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="mr-2 text-purple-500" size={20} />
            月付款分析
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="principalPaid" stackId="a" fill="#8884d8" name="本金" />
                <Bar dataKey="interestPaid" stackId="a" fill="#82ca9d" name="利息" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  // 主界面
  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* 頂部導航 */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                <DollarSign className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                DebtWise AI
              </h1>
              {isPremium && (
                <span className="ml-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  ✨ Premium
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowNotifications(true)}
                className="text-gray-600 hover:text-purple-600 transition-colors relative"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setIsPremium(!isPremium)}
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Settings size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="text-white" size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
              </div>
              <button 
                onClick={() => setCurrentUser(null)}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* 主要內容 */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'debts' && (
          <DebtsList
            debts={debts}
            debtTypes={debtTypes}
            onDeleteDebt={handleDeleteDebt}
            onAddDebt={() => setShowAddDebt(true)}
            getPaymentProgress={getPaymentProgress}
            getNextDueDate={getNextDueDate}
            getTotalDebt={getTotalDebt}
            getTotalMonthlyPayment={getTotalMonthlyPayment}
            getAverageInterestRate={getAverageInterestRate}
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

      {/* 底部導航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-2 py-2 z-30">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {[
            { id: 'dashboard', name: '總覽', emoji: '🏠' },
            { id: 'debts', name: '債務', emoji: '💳' },
            { id: 'strategy', name: '策略', emoji: '🎯' },
            { id: 'plan', name: '計劃', emoji: '📅' },
            { id: 'progress', name: '進度', emoji: '📈' }
          ].map(tab => (
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

      {/* 懸浮新增按鈕 */}
      <button
        onClick={() => setShowAddDebt(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </button>

      {/* 添加債務彈窗 */}
      {showAddDebt && (
        <AddDebtForm 
          onClose={() => setShowAddDebt(false)}
          onAddDebt={handleAddDebt}
          debtTypes={debtTypes}
        />
      )}
    </div>
  );
};

export default DebtWiseAI;