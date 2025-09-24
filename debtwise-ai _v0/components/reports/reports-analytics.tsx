"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingDown, Calendar, Download, DollarSign, Clock, Target } from "lucide-react"

interface MonthlyData {
  month: string
  totalPaid: number
  interestPaid: number
  principalPaid: number
  remainingBalance: number
  progress: number
}

export function ReportsAnalytics() {
  // Mock data - in real app this would come from state/API
  const monthlyTrends: MonthlyData[] = [
    {
      month: "2024-10",
      totalPaid: 45000,
      interestPaid: 12000,
      principalPaid: 33000,
      remainingBalance: 2310000,
      progress: 28,
    },
    {
      month: "2024-11",
      totalPaid: 48000,
      interestPaid: 11500,
      principalPaid: 36500,
      remainingBalance: 2273500,
      progress: 30,
    },
    {
      month: "2024-12",
      totalPaid: 52000,
      interestPaid: 11000,
      principalPaid: 41000,
      remainingBalance: 2232500,
      progress: 33,
    },
    {
      month: "2025-01",
      totalPaid: 55000,
      interestPaid: 10500,
      principalPaid: 44500,
      remainingBalance: 2188000,
      progress: 35,
    },
  ]

  const yearlyStats = {
    totalPaid: 1220000,
    interestSaved: 85000,
    principalPaid: 1135000,
    averageMonthlyPayment: 50833,
    debtReduction: 35,
    timeToFreedom: "4.2 年",
  }

  const debtBreakdown = [
    { type: "信用卡", amount: 85000, percentage: 3.8, color: "bg-red-500" },
    { type: "個人貸款", amount: 150000, percentage: 6.6, color: "bg-purple-500" },
    { type: "汽車貸款", amount: 450000, percentage: 19.9, color: "bg-green-500" },
    { type: "房屋貸款", amount: 2800000, percentage: 69.7, color: "bg-blue-500" },
  ]

  const projections = {
    currentStrategy: {
      payoffDate: "2029-03-15",
      totalInterest: 245000,
      monthsRemaining: 50,
    },
    optimizedStrategy: {
      payoffDate: "2028-08-20",
      totalInterest: 198000,
      monthsRemaining: 43,
      savings: 47000,
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>📊</span>
            報表與分析
          </h1>
          <p className="text-gray-600">深入了解您的財務狀況與還款進度</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          匯出報表
        </Button>
      </div>

      {/* Annual Summary Panel */}
      <Card className="glass p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-6 w-6" />
          <h2 className="text-xl font-bold">2024 年度摘要</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">NT${(yearlyStats.totalPaid / 1000).toFixed(0)}K</div>
            <div className="text-sm text-white/80">總還款金額</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">NT${(yearlyStats.interestSaved / 1000).toFixed(0)}K</div>
            <div className="text-sm text-white/80">節省利息</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{yearlyStats.debtReduction}%</div>
            <div className="text-sm text-white/80">債務減少</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{yearlyStats.timeToFreedom}</div>
            <div className="text-sm text-white/80">預估清償時間</div>
          </div>
        </div>
      </Card>

      {/* Monthly Trends */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          月度趨勢分析
        </h2>
        <Card className="glass p-6">
          <div className="space-y-4">
            {monthlyTrends.map((data, index) => (
              <div key={data.month} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {data.month}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      還款 NT${data.totalPaid.toLocaleString()} (本金: NT${data.principalPaid.toLocaleString()}, 利息:
                      NT$
                      {data.interestPaid.toLocaleString()})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{data.progress}%</div>
                    <div className="text-xs text-gray-500">完成度</div>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={data.progress} className="h-6" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    NT${(data.remainingBalance / 1000).toFixed(0)}K 剩餘
                  </div>
                </div>
                {index < monthlyTrends.length - 1 && <div className="border-b border-gray-200" />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Debt Composition */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          債務組成分析
        </h2>
        <Card className="glass p-6">
          <div className="space-y-4">
            {debtBreakdown.map((debt) => (
              <div key={debt.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{debt.type}</span>
                  <div className="text-right">
                    <span className="font-bold">NT${debt.amount.toLocaleString()}</span>
                    <span className="text-sm text-gray-500 ml-2">({debt.percentage}%)</span>
                  </div>
                </div>
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${debt.color} transition-all duration-500`}
                    style={{ width: `${debt.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Projections and Scenarios */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          還款預測與情境分析
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Strategy */}
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <h3 className="font-bold text-gray-800">目前策略</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  預計清償日期
                </span>
                <span className="font-medium">{projections.currentStrategy.payoffDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  總利息支出
                </span>
                <span className="font-medium">NT${projections.currentStrategy.totalInterest.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  剩餘月數
                </span>
                <span className="font-medium">{projections.currentStrategy.monthsRemaining} 個月</span>
              </div>
            </div>
          </Card>

          {/* Optimized Strategy */}
          <Card className="glass p-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <h3 className="font-bold text-gray-800">優化策略</h3>
              <Badge className="bg-green-500 text-white text-xs">推薦</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  預計清償日期
                </span>
                <span className="font-medium text-green-700">{projections.optimizedStrategy.payoffDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  總利息支出
                </span>
                <span className="font-medium text-green-700">
                  NT${projections.optimizedStrategy.totalInterest.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  剩餘月數
                </span>
                <span className="font-medium text-green-700">{projections.optimizedStrategy.monthsRemaining} 個月</span>
              </div>
              <div className="pt-2 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">潛在節省</span>
                  <span className="font-bold text-green-700">
                    NT${projections.optimizedStrategy.savings.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Key Insights */}
      <Card className="glass p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">💡</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-3">關鍵洞察與建議</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <span>您的還款進度超前預期 8%，繼續保持這個節奏！</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <span>建議優先償還信用卡債務，可節省約 NT$15,000 利息支出</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <span>如果每月增加 NT$5,000 還款，可提前 7 個月完成目標</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-3 hover:scale-105 transition-transform duration-200"
        >
          <BarChart3 className="h-5 w-5 mr-2" />
          查看詳細圖表
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-3 hover:scale-105 transition-transform duration-200 bg-transparent"
        >
          <Download className="h-5 w-5 mr-2" />
          下載完整報告
        </Button>
      </div>
    </div>
  )
}
