"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"
import { AddDebtModal } from "./add-debt-modal"
import { cn } from "@/lib/utils"

interface Debt {
  id: string
  name: string
  type: "credit-card" | "mortgage" | "auto" | "student" | "personal" | "investment" | "business" | "other"
  balance: number
  originalAmount: number
  interestRate: number
  minimumPayment: number
  dueDate: string
  term?: number // for loans with fixed terms
}

const debtTypeConfig = {
  "credit-card": { emoji: "💳", label: "信用卡", color: "border-red-500" },
  mortgage: { emoji: "🏠", label: "房屋貸款", color: "border-blue-500" },
  auto: { emoji: "🚗", label: "汽車貸款", color: "border-green-500" },
  student: { emoji: "🎓", label: "學生貸款", color: "border-yellow-500" },
  personal: { emoji: "💰", label: "個人貸款", color: "border-purple-500" },
  investment: { emoji: "📈", label: "投資", color: "border-orange-500" },
  business: { emoji: "🏢", label: "企業", color: "border-indigo-500" },
  other: { emoji: "📋", label: "其他", color: "border-gray-500" },
}

export function DebtManagement() {
  const [debts, setDebts] = useState<Debt[]>([
    {
      id: "1",
      name: "信用卡 A",
      type: "credit-card",
      balance: 85000,
      originalAmount: 120000,
      interestRate: 18.5,
      minimumPayment: 8000,
      dueDate: "2025-01-28",
    },
    {
      id: "2",
      name: "房屋貸款",
      type: "mortgage",
      balance: 2800000,
      originalAmount: 3500000,
      interestRate: 2.1,
      minimumPayment: 15000,
      dueDate: "2025-01-30",
      term: 240,
    },
    {
      id: "3",
      name: "汽車貸款",
      type: "auto",
      balance: 450000,
      originalAmount: 800000,
      interestRate: 4.5,
      minimumPayment: 12000,
      dueDate: "2025-02-01",
      term: 60,
    },
  ])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleAddDebt = (newDebt: Omit<Debt, "id">) => {
    const debt: Debt = {
      ...newDebt,
      id: Date.now().toString(),
    }
    setDebts([...debts, debt])
    setIsAddModalOpen(false)
  }

  const handleDeleteDebt = (id: string) => {
    setDebts(debts.filter((debt) => debt.id !== id))
  }

  const calculateProgress = (debt: Debt) => {
    return ((debt.originalAmount - debt.balance) / debt.originalAmount) * 100
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>💳</span>
            債務管理
          </h1>
          <p className="text-gray-600">管理您的所有債務項目</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          新增債務
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              NT${debts.reduce((sum, debt) => sum + debt.balance, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">總債務餘額</div>
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              NT${debts.reduce((sum, debt) => sum + debt.minimumPayment, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">月最低還款</div>
          </div>
        </Card>
        <Card className="glass p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {(debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">平均利率</div>
          </div>
        </Card>
      </div>

      {/* Debt Cards */}
      <div className="space-y-4">
        {debts.map((debt) => {
          const config = debtTypeConfig[debt.type]
          const progress = calculateProgress(debt)

          return (
            <Card key={debt.id} className={cn("glass p-6 border-l-4", config.color)}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-800">{debt.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteDebt(debt.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-800">NT${debt.balance.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">目前餘額</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-800">{debt.interestRate}%</div>
                  <div className="text-xs text-gray-600">利率</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-800">NT${debt.minimumPayment.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">最低還款</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-800">{debt.dueDate}</div>
                  <div className="text-xs text-gray-600">到期日</div>
                </div>
                {debt.term && (
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-800">{debt.term}期</div>
                    <div className="text-xs text-gray-600">貸款期數</div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">還款進度</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>已還: NT${(debt.originalAmount - debt.balance).toLocaleString()}</span>
                  <span>剩餘: NT${debt.balance.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {debts.length === 0 && (
        <Card className="glass p-12 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">尚未新增任何債務</h3>
          <p className="text-gray-600 mb-6">開始記錄您的債務項目，制定還款計畫</p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增第一筆債務
          </Button>
        </Card>
      )}

      {/* Add Debt Modal */}
      <AddDebtModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddDebt} />
    </div>
  )
}
