import React, { useState, useMemo } from 'react';
import { 
  Calendar, Download, Eye, EyeOff, ChevronDown, ChevronUp,
  TrendingDown, DollarSign, Clock, Target, BarChart3,
  CheckCircle, AlertCircle, Filter, Search, RefreshCw
} from 'lucide-react';

const PaymentPlanTable = ({
  debts,
  strategy = 'avalanche', // 'snowball' or 'avalanche'
  extraPayment = 0,
  onStrategyChange,
  onExtraPaymentChange
}) => {
  const [expandedMonths, setExpandedMonths] = useState(12);
  const [showDebtDetails, setShowDebtDetails] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 計算還款計劃
  const paymentPlan = useMemo(() => {
    if (!debts || debts.length === 0) return [];

    let workingDebts = debts.map(debt => ({ ...debt }));
    const totalMinimumPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const totalAvailablePayment = totalMinimumPayment + extraPayment;

    // 確定還款順序
    const orderedDebts = strategy === 'snowball' 
      ? [...workingDebts].sort((a, b) => a.principal - b.principal)
      : [...workingDebts].sort((a, b) => b.interestRate - a.interestRate);

    const plan = [];
    let month = 1;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;

    while (workingDebts.some(debt => debt.principal > 0) && month <= 600) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + month - 1);
      
      const monthPlan = {
        month,
        date: startDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' }),
        shortDate: startDate.toLocaleDateString('zh-TW', { year: '2-digit', month: 'short' }),
        debts: [],
        totalPayment: 0,
        totalInterest: 0,
        totalPrincipal: 0,
        totalRemaining: 0,
        completedDebts: [],
        cumulativeInterest: 0,
        cumulativePrincipal: 0
      };

      let remainingExtraPayment = extraPayment;

      // 計算每個債務的還款
      workingDebts.forEach(debt => {
        if (debt.principal > 0) {
          const monthlyInterest = (debt.principal * debt.interestRate / 100) / 12;
          const principalPayment = Math.min(debt.minimumPayment - monthlyInterest, debt.principal);
          
          monthPlan.debts.push({
            id: debt.id,
            name: debt.name,
            type: debt.type,
            startingBalance: debt.principal,
            minimumPayment: debt.minimumPayment,
            interest: monthlyInterest,
            principal: principalPayment,
            payment: debt.minimumPayment,
            extraPayment: 0,
            endingBalance: debt.principal - principalPayment,
            isCompleted: false
          });

          debt.principal -= principalPayment;
          monthPlan.totalPayment += debt.minimumPayment;
          monthPlan.totalInterest += monthlyInterest;
          monthPlan.totalPrincipal += principalPayment;
          cumulativeInterest += monthlyInterest;
          cumulativePrincipal += principalPayment;
        }
      });

      // 分配額外還款
      for (let orderedDebt of orderedDebts) {
        const workingDebt = workingDebts.find(d => d.id === orderedDebt.id);
        const monthDebt = monthPlan.debts.find(d => d.id === orderedDebt.id);
        
        if (workingDebt && workingDebt.principal > 0 && remainingExtraPayment > 0 && monthDebt) {
          const extraForThisDebt = Math.min(remainingExtraPayment, workingDebt.principal);
          workingDebt.principal -= extraForThisDebt;
          remainingExtraPayment -= extraForThisDebt;
          
          monthDebt.extraPayment = extraForThisDebt;
          monthDebt.principal += extraForThisDebt;
          monthDebt.payment += extraForThisDebt;
          monthDebt.endingBalance = workingDebt.principal;
          
          if (workingDebt.principal === 0) {
            monthDebt.isCompleted = true;
            monthPlan.completedDebts.push(monthDebt.name);
          }
          
          monthPlan.totalPayment += extraForThisDebt;
          monthPlan.totalPrincipal += extraForThisDebt;
          cumulativePrincipal += extraForThisDebt;
        }
      }

      monthPlan.totalRemaining = workingDebts.reduce((sum, debt) => sum + debt.principal, 0);
      monthPlan.cumulativeInterest = cumulativeInterest;
      monthPlan.cumulativePrincipal = cumulativePrincipal;

      plan.push(monthPlan);

      // 移除已清償的債務
      workingDebts = workingDebts.filter(debt => debt.principal > 0);
      month++;
    }

    return plan;
  }, [debts, strategy, extraPayment]);

  // 計算總結統計
  const summaryStats = useMemo(() => {
    if (paymentPlan.length === 0) return null;

    const totalMonths = paymentPlan.length;
    const totalPaid = paymentPlan.reduce((sum, month) => sum + month.totalPayment, 0);
    const totalInterest = paymentPlan.reduce((sum, month) => sum + month.totalInterest, 0);
    const totalPrincipal = paymentPlan.reduce((sum, month) => sum + month.totalPrincipal, 0);
    const averageMonthlyPayment = totalPaid / totalMonths;

    return {
      totalMonths,
      totalPaid,
      totalInterest,
      totalPrincipal,
      averageMonthlyPayment,
      completionDate: paymentPlan[paymentPlan.length - 1]?.date || ''
    };
  }, [paymentPlan]);

  // 格式化貨幣
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 獲取債務類型圖標
  const getDebtIcon = (type) => {
    const icons = {
      '信用卡': '💳', '房貸': '🏠', '車貸': '🚗', 
      '學貸': '🎓', '個人信貸': '💰', '其他': '📋'
    };
    return icons[type] || '📋';
  };

  // 導出計劃表
  const exportPlan = (format) => {
    console.log(`導出${format}格式的還款計劃表`);
    // 這裡可以實現實際的導出邏輯
  };

  // 月度詳情彈窗
  const MonthDetailModal = ({ monthData, onClose }) => {
    if (!monthData) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {monthData.date} 詳細還款計劃
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl"
            >
              ✕
            </button>
          </div>

          {/* 月度摘要 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-600 mb-1">總還款</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(monthData.totalPayment)}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <p className="text-sm text-red-600 mb-1">利息</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(monthData.totalInterest)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <p className="text-sm text-green-600 mb-1">本金</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(monthData.totalPrincipal)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <p className="text-sm text-purple-600 mb-1">剩餘債務</p>
              <p className="text-xl font-bold text-purple-700">
                {formatCurrency(monthData.totalRemaining)}
              </p>
            </div>
          </div>

          {/* 完成的債務 */}
          {monthData.completedDebts.length > 0 && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
              <h4 className="font-bold text-green-800 mb-2 flex items-center">
                <CheckCircle className="mr-2" size={20} />
                本月完成清償
              </h4>
              <div className="flex flex-wrap gap-2">
                {monthData.completedDebts.map(debtName => (
                  <span key={debtName} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    🎉 {debtName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 債務明細 */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-800">債務還款明細</h4>
            {monthData.debts.map(debt => (
              <div key={debt.id} className={`p-4 rounded-xl border-2 ${
                debt.isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="mr-2 text-xl">{getDebtIcon(debt.type)}</span>
                    <div>
                      <h5 className="font-medium text-gray-800">{debt.name}</h5>
                      <p className="text-sm text-gray-600">{debt.type}</p>
                    </div>
                  </div>
                  {debt.isCompleted && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="mr-1" size={16} />
                      <span className="text-sm font-medium">已清償</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">期初餘額</p>
                    <p className="font-medium">{formatCurrency(debt.startingBalance)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">利息</p>
                    <p className="font-medium text-red-600">{formatCurrency(debt.interest)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">本金還款</p>
                    <p className="font-medium text-green-600">{formatCurrency(debt.principal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">期末餘額</p>
                    <p className="font-medium">{formatCurrency(debt.endingBalance)}</p>
                  </div>
                </div>

                {debt.extraPayment > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💪 額外還款：{formatCurrency(debt.extraPayment)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!debts || debts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">還款計劃表</h2>
        <p className="text-gray-600">請先新增債務項目並選擇還款策略</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 計劃摘要 */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <Calendar className="mr-3" size={28} />
            還款計劃表
          </h2>
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
              {strategy === 'snowball' ? '🎯 雪球法' : '⚡ 雪崩法'}
            </span>
            {extraPayment > 0 && (
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                💪 額外還款 {formatCurrency(extraPayment)}
              </span>
            )}
          </div>
        </div>
        
        {summaryStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-white/80 text-sm mb-1">完成時間</p>
              <p className="text-xl font-bold">{summaryStats.totalMonths} 個月</p>
              <p className="text-white/70 text-xs">
                {Math.floor(summaryStats.totalMonths / 12)}年{summaryStats.totalMonths % 12}個月
              </p>
            </div>
            <div className="text-center">
              <p className="text-white/80 text-sm mb-1">總支出</p>
              <p className="text-xl font-bold">{formatCurrency(summaryStats.totalPaid)}</p>
              <p className="text-white/70 text-xs">平均月付 {formatCurrency(summaryStats.averageMonthlyPayment)}</p>
            </div>
            <div className="text-center">
              <p className="text-white/80 text-sm mb-1">利息支出</p>
              <p className="text-xl font-bold">{formatCurrency(summaryStats.totalInterest)}</p>
              <p className="text-white/70 text-xs">
                佔比 {((summaryStats.totalInterest / summaryStats.totalPaid) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-white/80 text-sm mb-1">預計完成</p>
              <p className="text-xl font-bold">{summaryStats.completionDate.split('年')[1]}</p>
              <p className="text-white/70 text-xs">{summaryStats.completionDate.split('年')[0]}年</p>
            </div>
          </div>
        )}
      </div>

      {/* 控制面板 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">顯示月數</label>
              <select
                value={expandedMonths}
                onChange={(e) => setExpandedMonths(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={6}>前 6 個月</option>
                <option value={12}>前 12 個月</option>
                <option value={24}>前 24 個月</option>
                <option value={paymentPlan.length}>全部 ({paymentPlan.length} 個月)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">額外還款</label>
              <input
                type="number"
                value={extraPayment}
                onChange={(e) => onExtraPaymentChange?.(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-32"
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDebtDetails(!showDebtDetails)}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showDebtDetails ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="ml-1 text-sm">{showDebtDetails ? '隱藏' : '顯示'}明細</span>
            </button>
            
            <button
              onClick={() => exportPlan('Excel')}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              <span className="ml-1 text-sm">Excel</span>
            </button>
            
            <button
              onClick={() => exportPlan('PDF')}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download size={16} />
              <span className="ml-1 text-sm">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 還款計劃表 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">月份</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">日期</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">總還款</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">利息</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">本金</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">剩餘債務</th>
                {showDebtDetails && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">債務明細</th>
                )}
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paymentPlan.slice(0, expandedMonths).map((month, index) => (
                <tr 
                  key={month.month} 
                  className={`hover:bg-gray-50 transition-colors ${
                    month.completedDebts.length > 0 ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-4 py-4 font-medium text-gray-800">
                    第 {month.month} 月
                    {month.completedDebts.length > 0 && (
                      <div className="flex items-center mt-1">
                        <CheckCircle className="text-green-600 mr-1" size={14} />
                        <span className="text-xs text-green-600">債務清償</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{month.shortDate}</td>
                  <td className="px-4 py-4 text-right font-bold text-blue-600">
                    {formatCurrency(month.totalPayment)}
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-red-600">
                    {formatCurrency(month.totalInterest)}
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-green-600">
                    {formatCurrency(month.totalPrincipal)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-purple-600">
                    {formatCurrency(month.totalRemaining)}
                  </td>
                  {showDebtDetails && (
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {month.debts.filter(debt => debt.payment > 0).slice(0, 3).map(debt => (
                          <div key={debt.id} className="flex items-center justify-between text-xs">
                            <span className="flex items-center">
                              <span className="mr-1">{getDebtIcon(debt.type)}</span>
                              {debt.name}
                              {debt.isCompleted && <CheckCircle className="text-green-600 ml-1" size={12} />}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(debt.payment)}
                              {debt.extraPayment > 0 && (
                                <span className="text-blue-600 ml-1">+{formatCurrency(debt.extraPayment)}</span>
                              )}
                            </span>
                          </div>
                        ))}
                        {month.debts.filter(debt => debt.payment > 0).length > 3 && (
                          <div className="text-xs text-gray-500">
                            還有 {month.debts.filter(debt => debt.payment > 0).length - 3} 項...
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setSelectedMonth(month)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {paymentPlan.length > expandedMonths && (
          <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-200">
            <button 
              onClick={() => setExpandedMonths(paymentPlan.length)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              顯示完整計劃表 (共 {paymentPlan.length} 個月) 
              <ChevronDown className="inline ml-1" size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 策略比較 */}
      {showComparison && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">策略效果比較</h3>
          {/* 這裡可以添加策略比較邏輯 */}
        </div>
      )}

      {/* 月度詳情彈窗 */}
      {selectedMonth && (
        <MonthDetailModal
          monthData={selectedMonth}
          onClose={() => setSelectedMonth(null)}
        />
      )}
    </div>
  );
};

// 使用示例
const PaymentPlanTableExample = () => {
  const [strategy, setStrategy] = useState('avalanche');
  const [extraPayment, setExtraPayment] = useState(3000);

  const sampleDebts = [
    {
      id: 1,
      name: '中信信用卡',
      principal: 50000,
      originalPrincipal: 80000,
      interestRate: 18.5,
      minimumPayment: 2000,
      type: '信用卡'
    },
    {
      id: 2,
      name: '房屋貸款',
      principal: 2000000,
      originalPrincipal: 2500000,
      interestRate: 2.1,
      minimumPayment: 15000,
      type: '房貸'
    },
    {
      id: 3,
      name: '汽車貸款',
      principal: 300000,
      originalPrincipal: 500000,
      interestRate: 4.8,
      minimumPayment: 8000,
      type: '車貸'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">還款計劃表組件示例</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">還款策略</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="avalanche">⚡ 雪崩法（高利率優先）</option>
              <option value="snowball">🎯 雪球法（小額優先）</option>
            </select>
          </div>
        </div>
      </div>
      
      <PaymentPlanTable
        debts={sampleDebts}
        strategy={strategy}
        extraPayment={extraPayment}
        onStrategyChange={setStrategy}
        onExtraPaymentChange={setExtraPayment}
      />
    </div>
  );
};

export default PaymentPlanTableExample;