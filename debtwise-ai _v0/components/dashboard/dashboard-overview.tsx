"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, AlertCircle, Plus, DollarSign, BarChart3, Target } from "lucide-react"
import { useState, useEffect } from "react"
import { AddDebtDialog } from "@/components/debts/add-debt-dialog"
import { AddPaymentDialog } from "@/components/payments/add-payment-dialog"
import Link from "next/link"

interface DashboardData {
  summary: {
    totalDebt: number
    monthlyMinimum: number
    avgInterestRate: number
    monthlyPaid: number
    debtCount: number
  }
  debts: Array<{
    id: string
    name: string
    type: string
    current_balance: number
    minimum_payment: number
    due_date: string | null
  }>
  recentPayments: Array<{
    id: string
    amount: number
    payment_date: string
    debts: { name: string; type: string }
  }>
  goals: Array<{
    id: string
    title: string
    current_progress: number
    target_amount: number | null
  }>
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDebt, setShowAddDebt] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/dashboard")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "獲取資料失敗")
      }

      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="glass p-6 bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse">
          <div className="h-32 bg-white/20 rounded"></div>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="glass p-4 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="glass p-6 text-center">
        <div className="text-red-500 mb-4">載入失敗: {error}</div>
        <Button onClick={fetchDashboardData}>重試</Button>
      </Card>
    )
  }

  if (!data) return null

  const { summary, debts, recentPayments, goals } = data

  // 計算還款進度 (本月已付 / 最低還款)
  const payoffProgress =
    summary.monthlyMinimum > 0 ? Math.min(100, (summary.monthlyPaid / summary.monthlyMinimum) * 100) : 0

  // 找出即將到期的債務 (7天內)
  const upcomingPayments = debts
    .filter((debt) => {
      if (!debt.due_date) return false
      const dueDate = new Date(debt.due_date)
      const today = new Date()
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && diffDays >= 0
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())

  const quickActions = [
    {
      icon: Plus,
      title: "新增債務",
      description: "記錄新的債務項目",
      onClick: () => setShowAddDebt(true),
    },
    {
      icon: DollarSign,
      title: "記錄還款",
      description: "更新還款進度",
      onClick: () => setShowAddPayment(true),
    },
    {
      icon: BarChart3,
      title: "查看報表",
      description: "分析財務狀況",
      href: "/reports",
    },
    {
      icon: Target,
      title: "設定目標",
      description: "制定還款策略",
      href: "/strategy",
    },
  ]

  return (
    <>
      <div className="space-y-6">
        {/* Main Debt Overview Card */}
        <Card className="glass p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">NT${summary.totalDebt.toLocaleString()}</div>
              <div className="text-sm text-white/80">總債務</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">NT${summary.monthlyPaid.toLocaleString()}</div>
              <div className="text-sm text-white/80">本月已付</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.debtCount}</div>
              <div className="text-sm text-white/80">債務項目</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>本月還款進度</span>
              <span>{payoffProgress.toFixed(1)}%</span>
            </div>
            <Progress value={payoffProgress} className="h-3 bg-white/20" />
            <div className="text-xs text-white/70">
              已付 NT${summary.monthlyPaid.toLocaleString()} / 最低 NT${summary.monthlyMinimum.toLocaleString()}
            </div>
          </div>
        </Card>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚡</span>
            快速操作
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const ActionIcon = action.icon
              const content = (
                <Card
                  key={index}
                  className="glass p-4 hover:scale-105 transition-transform duration-200 cursor-pointer"
                >
                  <div className="text-center space-y-2">
                    <ActionIcon className="h-8 w-8 mx-auto text-purple-600" />
                    <div className="font-medium text-gray-800">{action.title}</div>
                    <div className="text-sm text-gray-600">{action.description}</div>
                  </div>
                </Card>
              )

              return action.href ? (
                <Link key={index} href={action.href}>
                  {content}
                </Link>
              ) : (
                <div key={index} onClick={action.onClick}>
                  {content}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              即將到期付款
              <Badge className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white">
                {upcomingPayments.length}
              </Badge>
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/debts">查看全部</Link>
            </Button>
          </div>

          {upcomingPayments.length > 0 ? (
            <div className="space-y-3">
              {upcomingPayments.map((payment) => {
                const daysUntilDue = Math.ceil(
                  (new Date(payment.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                )
                const isUrgent = daysUntilDue <= 3

                return (
                  <Card
                    key={payment.id}
                    className={`glass p-4 ${isUrgent ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {payment.type === "credit_card" && "💳"}
                          {payment.type === "mortgage" && "🏠"}
                          {payment.type === "car_loan" && "🚗"}
                          {payment.type === "personal_loan" && "💰"}
                          {payment.type === "student_loan" && "🎓"}
                          {payment.type === "other" && "📄"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{payment.name}</div>
                          <div className="text-sm text-gray-600">{payment.due_date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">NT${payment.minimum_payment.toLocaleString()}</div>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {daysUntilDue === 0 ? "今天到期" : `${daysUntilDue}天後到期`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="glass p-8 text-center">
              <div className="text-4xl mb-2">✨</div>
              <div className="text-gray-600">太棒了！目前沒有即將到期的付款</div>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        {recentPayments.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📝</span>
              最近活動
            </h2>
            <div className="space-y-2">
              {recentPayments.slice(0, 3).map((payment) => (
                <Card key={payment.id} className="glass p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">還款 - {payment.debts.name}</div>
                        <div className="text-xs text-gray-600">{payment.payment_date}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-600">-NT${payment.amount.toLocaleString()}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddDebtDialog open={showAddDebt} onOpenChange={setShowAddDebt} onSuccess={fetchDashboardData} />
      <AddPaymentDialog open={showAddPayment} onOpenChange={setShowAddPayment} onSuccess={fetchDashboardData} />
    </>
  )
}
