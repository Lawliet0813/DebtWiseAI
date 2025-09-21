import { useEffect, useState } from 'react';
import {
  DollarSign, Target, Zap, CheckCircle, TrendingDown, BarChart3,
  AlertCircle, Lightbulb, RefreshCw, Plus
} from 'lucide-react';

const PaymentStrategy = ({
  debts,
  monthlyBudget,
  setMonthlyBudget,
  strategiesComparison,
  extraPayment,
  setExtraPayment,
  calculateExtraPaymentEffect,
  onAddDebt
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState(() =>
    monthlyBudget ? String(monthlyBudget) : '',
  );
  const [extraPaymentInput, setExtraPaymentInput] = useState(() =>
    extraPayment ? String(extraPayment) : '',
  );

  useEffect(() => {
    if (monthlyBudgetInput === '' && monthlyBudget === 0) {
      return;
    }
    if (!Number.isNaN(parseFloat(monthlyBudgetInput)) && parseFloat(monthlyBudgetInput) === monthlyBudget) {
      return;
    }
    setMonthlyBudgetInput(monthlyBudget === 0 ? '' : String(monthlyBudget));
  }, [monthlyBudget, monthlyBudgetInput]);

  useEffect(() => {
    if (extraPaymentInput === '' && extraPayment === 0) {
      return;
    }
    if (!Number.isNaN(parseFloat(extraPaymentInput)) && parseFloat(extraPaymentInput) === extraPayment) {
      return;
    }
    setExtraPaymentInput(extraPayment === 0 ? '' : String(extraPayment));
  }, [extraPayment, extraPaymentInput]);

  const handleMonthlyBudgetChange = (event) => {
    const value = event.target.value;
    if (!/^\d*(\.\d*)?$/.test(value)) {
      return;
    }
    setMonthlyBudgetInput(value);
    const parsed = parseFloat(value);
    setMonthlyBudget(Number.isNaN(parsed) ? 0 : parsed);
  };

  const handleExtraPaymentChange = (event) => {
    const value = event.target.value;
    if (!/^\d*(\.\d*)?$/.test(value)) {
      return;
    }
    setExtraPaymentInput(value);
    const parsed = parseFloat(value);
    setExtraPayment(Number.isNaN(parsed) ? 0 : parsed);
  };

  // 如果沒有債務，顯示添加債務的提示
  if (!debts || debts.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">還款策略</h2>

        <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
          <div className="text-6xl mb-6">🎯</div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">還沒有債務資料</h3>
          <p className="text-gray-600 mb-8">
            新增債務資料後，AI 將為您分析最佳的還款策略
          </p>
          <button
            onClick={onAddDebt}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
          >
            <Plus className="mr-2" size={20} />
            新增債務
          </button>
        </div>
      </div>
    );
  }

  // 計算基本統計
  const totalDebt = debts.reduce((sum, debt) => sum + debt.principal, 0);
  const totalMinimumPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const avgInterestRate = debts.reduce((sum, debt) => sum + (debt.principal * debt.interestRate), 0) / totalDebt;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">還款策略分析</h2>
        <div className="flex items-center space-x-2">
          <Lightbulb className="text-yellow-500" size={20} />
          <span className="text-sm text-gray-600">AI 智能推薦</span>
        </div>
      </div>

      {/* 預算設定 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <DollarSign className="mr-2 text-green-500" size={20} />
          月還款預算
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每月可用預算
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                inputMode="decimal"
                value={monthlyBudgetInput}
                onChange={handleMonthlyBudgetChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="輸入月預算"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              額外還款
            </label>
            <div className="relative">
              <Plus className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                inputMode="decimal"
                value={extraPaymentInput}
                onChange={handleExtraPaymentChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="額外還款金額"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">最低還款</p>
            <p className="text-lg font-bold text-gray-800">
              ${totalMinimumPayment.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">總預算</p>
            <p className="text-lg font-bold text-green-600">
              ${(monthlyBudget + extraPayment).toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">額外可用</p>
            <p className="text-lg font-bold text-blue-600">
              ${Math.max(0, monthlyBudget + extraPayment - totalMinimumPayment).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 策略比較 */}
      {strategiesComparison && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="mr-2 text-purple-500" size={20} />
            策略比較分析
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 雪球法 */}
            <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800 flex items-center">
                  <Target className="mr-2 text-orange-500" size={16} />
                  雪球法
                </h4>
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  心理激勵
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">還款月數：</span>
                  <span className="font-semibold">{strategiesComparison.snowball?.months || 0} 個月</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">總利息：</span>
                  <span className="font-semibold">${(strategiesComparison.snowball?.totalInterest || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">完成日期：</span>
                  <span className="font-semibold">{strategiesComparison.snowball?.payoffDate || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 雪崩法 */}
            <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800 flex items-center">
                  <Zap className="mr-2 text-blue-500" size={16} />
                  雪崩法
                </h4>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  數學最優
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">還款月數：</span>
                  <span className="font-semibold">{strategiesComparison.avalanche?.months || 0} 個月</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">總利息：</span>
                  <span className="font-semibold">${(strategiesComparison.avalanche?.totalInterest || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">完成日期：</span>
                  <span className="font-semibold">{strategiesComparison.avalanche?.payoffDate || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 推薦策略 */}
          {strategiesComparison.comparison && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
              <div className="flex items-center mb-2">
                <CheckCircle className="text-purple-600 mr-2" size={20} />
                <h4 className="font-bold text-purple-800">AI 推薦策略</h4>
              </div>
              <p className="text-purple-700 text-sm">
                <strong>{strategiesComparison.comparison.recommendedStrategy === 'avalanche' ? '雪崩法' : '雪球法'}</strong>
                {' - '}
                {strategiesComparison.comparison.reasoning}
              </p>
              {strategiesComparison.comparison.interestSavings > 0 && (
                <p className="text-green-600 text-sm mt-1">
                  💰 可節省利息：${strategiesComparison.comparison.interestSavings.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 債務概覽 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <TrendingDown className="mr-2 text-red-500" size={20} />
          債務概覽
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">總債務</p>
            <p className="text-2xl font-bold text-red-600">
              ${totalDebt.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">月還款</p>
            <p className="text-2xl font-bold text-orange-600">
              ${totalMinimumPayment.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">平均利率</p>
            <p className="text-2xl font-bold text-yellow-600">
              {avgInterestRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {debts.slice(0, 3).map((debt, index) => (
            <div key={debt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 bg-${debt.color || 'gray'}-500`} />
                <div>
                  <p className="font-semibold text-gray-800">{debt.name}</p>
                  <p className="text-sm text-gray-600">{debt.interestRate}% APR</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">${debt.principal.toLocaleString()}</p>
                <p className="text-sm text-gray-600">${debt.minimumPayment}/月</p>
              </div>
            </div>
          ))}
        </div>

        {debts.length > 3 && (
          <p className="text-center text-gray-500 text-sm mt-3">
            還有 {debts.length - 3} 筆債務...
          </p>
        )}
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onAddDebt}
          className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-left"
        >
          <div className="flex items-center mb-2">
            <Plus className="text-purple-600 mr-2" size={20} />
            <h3 className="font-bold text-gray-800">新增債務</h3>
          </div>
          <p className="text-sm text-gray-600">添加更多債務來完善分析</p>
        </button>

        <button
          onClick={() => setShowComparison(!showComparison)}
          className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-left"
        >
          <div className="flex items-center mb-2">
            <RefreshCw className="text-blue-600 mr-2" size={20} />
            <h3 className="font-bold text-gray-800">重新計算</h3>
          </div>
          <p className="text-sm text-gray-600">更新預算後重新分析策略</p>
        </button>
      </div>

      {/* 預算不足警告 */}
      {monthlyBudget < totalMinimumPayment && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center">
          <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-800">預算不足警告</p>
            <p className="text-sm text-red-600">
              您的月預算 ${monthlyBudget.toLocaleString()} 低於最低還款要求 ${totalMinimumPayment.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStrategy;