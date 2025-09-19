import { useState, useMemo } from 'react';
import {
  Calendar, DollarSign, TrendingDown, BarChart3, Clock,
  ChevronDown, ChevronUp, Target, Zap, Download, Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PaymentPlan = ({
  debts,
  monthlyBudget,
  extraPayment,
  strategiesComparison
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState('avalanche');
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [showChart, setShowChart] = useState(true);

  // 如果沒有債務或策略比較數據
  if (!debts || debts.length === 0 || !strategiesComparison) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">還款計劃表</h2>

        <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
          <div className="text-6xl mb-6">📅</div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">無法生成還款計劃</h3>
          <p className="text-gray-600">
            請先新增債務並設定月預算，才能查看詳細的還款計劃表
          </p>
        </div>
      </div>
    );
  }

  // 取得選中策略的計劃數據
  const selectedPlan = strategiesComparison[selectedStrategy];

  // 生成月度還款計劃（簡化版）
  const monthlyPlan = useMemo(() => {
    if (!selectedPlan || !selectedPlan.schedule) return [];

    return selectedPlan.schedule.map((month, index) => ({
      monthIndex: month.monthIndex,
      date: new Date(month.date),
      displayDate: new Date(month.date).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short'
      }),
      totalPayment: month.totalPaid,
      interestPaid: month.totalInterest,
      principalPaid: month.totalPaid - month.totalInterest,
      remainingBalance: month.remainingBalance,
      payments: month.payments || []
    }));
  }, [selectedPlan]);

  // 計算統計數據
  const stats = useMemo(() => {
    if (!selectedPlan) return null;

    return {
      totalMonths: selectedPlan.months,
      totalInterest: selectedPlan.totalInterest,
      totalPaid: selectedPlan.totalPaid,
      monthlyPayment: monthlyBudget + extraPayment,
      payoffDate: selectedPlan.payoffDate
    };
  }, [selectedPlan, monthlyBudget, extraPayment]);

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">還款計劃表</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <BarChart3 className="mr-2" size={16} />
            {showChart ? '隱藏圖表' : '顯示圖表'}
          </button>
          <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Download className="mr-2" size={16} />
            匯出 PDF
          </button>
        </div>
      </div>

      {/* 策略選擇 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Target className="mr-2 text-purple-500" size={20} />
          選擇還款策略
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedStrategy('snowball')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedStrategy === 'snowball'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center mb-2">
              <Target className="mr-2 text-orange-500" size={20} />
              <h4 className="font-bold text-gray-800">雪球法</h4>
            </div>
            <p className="text-sm text-gray-600 text-left">
              優先償還小額債務，建立還款動力
            </p>
            <div className="mt-2 text-left">
              <p className="text-xs text-gray-500">
                {strategiesComparison.snowball?.months || 0} 個月完成
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedStrategy('avalanche')}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedStrategy === 'avalanche'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center mb-2">
              <Zap className="mr-2 text-blue-500" size={20} />
              <h4 className="font-bold text-gray-800">雪崩法</h4>
            </div>
            <p className="text-sm text-gray-600 text-left">
              優先償還高利率債務，節省利息
            </p>
            <div className="mt-2 text-left">
              <p className="text-xs text-gray-500">
                {strategiesComparison.avalanche?.months || 0} 個月完成
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 計劃統計 */}
      {stats && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="mr-2 text-green-500" size={20} />
            計劃概覽
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="mx-auto mb-2 text-blue-500" size={20} />
              <p className="text-sm text-gray-600 mb-1">還款期間</p>
              <p className="text-lg font-bold text-blue-600">
                {stats.totalMonths} 個月
              </p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <DollarSign className="mx-auto mb-2 text-red-500" size={20} />
              <p className="text-sm text-gray-600 mb-1">總利息</p>
              <p className="text-lg font-bold text-red-600">
                ${stats.totalInterest.toLocaleString()}
              </p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingDown className="mx-auto mb-2 text-green-500" size={20} />
              <p className="text-sm text-gray-600 mb-1">月付款</p>
              <p className="text-lg font-bold text-green-600">
                ${stats.monthlyPayment.toLocaleString()}
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="mx-auto mb-2 text-purple-500" size={20} />
              <p className="text-sm text-gray-600 mb-1">完成日期</p>
              <p className="text-lg font-bold text-purple-600">
                {new Date(stats.payoffDate).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'short'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 還款趨勢圖表 */}
      {showChart && monthlyPlan.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="mr-2 text-purple-500" size={20} />
            還款趨勢圖
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPlan.slice(0, 24)}> {/* 只顯示前24個月 */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                  labelFormatter={(label) => `月份: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="remainingBalance"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="剩餘債務"
                />
                <Line
                  type="monotone"
                  dataKey="principalPaid"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="本金還款"
                />
                <Line
                  type="monotone"
                  dataKey="interestPaid"
                  stroke="#ffc658"
                  strokeWidth={2}
                  name="利息支付"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 月度還款明細表 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Calendar className="mr-2 text-blue-500" size={20} />
            月度還款明細
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  月份
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  總付款
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  本金
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  利息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  剩餘餘額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  詳細
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyPlan.slice(0, 12).map((month) => (
                <>
                  <tr key={month.monthIndex} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.displayDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${month.totalPayment.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ${month.principalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      ${month.interestPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${month.remainingBalance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setExpandedMonth(
                          expandedMonth === month.monthIndex ? null : month.monthIndex
                        )}
                        className="flex items-center text-purple-600 hover:text-purple-800"
                      >
                        {expandedMonth === month.monthIndex ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* 展開的詳細信息 */}
                  {expandedMonth === month.monthIndex && month.payments && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-800 mb-3">債務明細：</h4>
                          {month.payments.map((payment, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <div>
                                <p className="font-medium text-gray-800">{payment.debtName}</p>
                                <p className="text-sm text-gray-600">
                                  利息: ${(payment.interestAccrued || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-800">
                                  ${payment.payment.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  剩餘: ${payment.balanceRemaining.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {monthlyPlan.length > 12 && (
          <div className="p-4 bg-gray-50 text-center">
            <p className="text-gray-600 text-sm">
              顯示前 12 個月，共 {monthlyPlan.length} 個月的還款計劃
            </p>
          </div>
        )}
      </div>

      {/* 小貼士 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-bold text-blue-800 mb-3 flex items-center">
          💡 還款小貼士
        </h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• 設定自動轉帳，避免遲繳費用</li>
          <li>• 有額外收入時，優先還款高利率債務</li>
          <li>• 定期檢視計劃，根據財務狀況調整</li>
          <li>• 完成一筆債務後，將該筆還款金額加到下一筆債務</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentPlan;