"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Target, Zap, Lightbulb, Rocket, CheckCircle } from "lucide-react"

interface Debt {
  id: string
  name: string
  balance: number
  interestRate: number
  minimumPayment: number
}

export function StrategySelection() {
  const [selectedStrategy, setSelectedStrategy] = useState<"snowball" | "avalanche" | null>(null)
  const [extraPayment, setExtraPayment] = useState<number>(0)

  // Mock debt data - in real app this would come from state/API
  const debts: Debt[] = [
    { id: "1", name: "信用卡 A", balance: 85000, interestRate: 18.5, minimumPayment: 8000 },
    { id: "2", name: "個人貸款", balance: 150000, interestRate: 12.0, minimumPayment: 5000 },
    { id: "3", name: "汽車貸款", balance: 450000, interestRate: 4.5, minimumPayment: 12000 },
    { id: "4", name: "房屋貸款", balance: 2800000, interestRate: 2.1, minimumPayment: 15000 },
  ]

  const totalMinimumPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0)

  // Snowball method: Sort by balance (lowest first)
  const snowballOrder = [...debts].sort((a, b) => a.balance - b.balance)

  // Avalanche method: Sort by interest rate (highest first)
  const avalancheOrder = [...debts].sort((a, b) => b.interestRate - a.interestRate)

  const calculateSavings = (strategy: "snowball" | "avalanche") => {
    // Simplified calculation for demo purposes
    const baseInterest = debts.reduce((sum, debt) => sum + (debt.balance * debt.interestRate) / 100, 0)
    const strategySavings = strategy === "avalanche" ? baseInterest * 0.15 : baseInterest * 0.08
    return Math.round(strategySavings)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🎯</span>
          還款策略選擇
        </h1>
        <p className="text-gray-600">選擇最適合您的債務還款策略</p>
      </div>

      {/* Strategy Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Snowball Method */}
        <Card
          className={`glass p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
            selectedStrategy === "snowball" ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
          }`}
          onClick={() => setSelectedStrategy("snowball")}
        >
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">雪球法</h3>
            <p className="text-sm text-gray-600">先還最小餘額，建立成就感</p>
          </div>

          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-700">優先償還餘額最小的債務，快速消除債務項目，建立還款動力和成就感。</p>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">還款順序：</h4>
              <div className="space-y-2">
                {snowballOrder.map((debt, index) => (
                  <div key={debt.id} className="flex items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 rounded-full p-0 flex items-center justify-center bg-blue-100 text-blue-700"
                    >
                      {index + 1}
                    </Badge>
                    <span>{debt.name}</span>
                    <span className="text-gray-500">NT${debt.balance.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant={selectedStrategy === "snowball" ? "default" : "outline"}
            className={`w-full ${
              selectedStrategy === "snowball"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                : ""
            }`}
          >
            選擇雪球法
          </Button>
        </Card>

        {/* Avalanche Method */}
        <Card
          className={`glass p-6 cursor-pointer transition-all duration-200 hover:scale-105 ${
            selectedStrategy === "avalanche" ? "ring-2 ring-red-500 bg-red-50/50" : ""
          }`}
          onClick={() => setSelectedStrategy("avalanche")}
        >
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">雪崩法</h3>
            <p className="text-sm text-gray-600">先還高利率，節省更多利息</p>
          </div>

          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-700">優先償還利率最高的債務，從數學角度最省錢，能節省最多利息支出。</p>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">還款順序：</h4>
              <div className="space-y-2">
                {avalancheOrder.map((debt, index) => (
                  <div key={debt.id} className="flex items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 rounded-full p-0 flex items-center justify-center bg-red-100 text-red-700"
                    >
                      {index + 1}
                    </Badge>
                    <span>{debt.name}</span>
                    <span className="text-gray-500">{debt.interestRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant={selectedStrategy === "avalanche" ? "default" : "outline"}
            className={`w-full ${
              selectedStrategy === "avalanche"
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                : ""
            }`}
          >
            選擇雪崩法
          </Button>
        </Card>
      </div>

      {/* AI Recommendation Panel */}
      <Card className="glass p-6 bg-gradient-to-r from-green-50 via-purple-50 to-blue-50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              AI 智慧推薦
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">推薦</Badge>
            </h3>
            <div className="glass p-4 mb-4">
              <p className="text-gray-700 mb-3">
                根據您的債務結構分析，我們推薦使用<strong>雪崩法</strong>：
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>預計節省利息：NT${calculateSavings("avalanche").toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>縮短還款時間：約 8 個月</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>高利率債務優先處理</span>
                </div>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Rocket className="h-4 w-4 mr-2" />
              採用 AI 推薦策略
            </Button>
          </div>
        </div>
      </Card>

      {/* Extra Payment Input */}
      <Card className="glass p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">💰</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-2">額外還款金額</h3>
            <p className="text-gray-600 mb-4">除了最低還款外，您每月可以額外還款多少？</p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="extraPayment" className="text-sm font-medium">
                  額外還款 (NT$)
                </Label>
                <Input
                  id="extraPayment"
                  type="number"
                  value={extraPayment || ""}
                  onChange={(e) => setExtraPayment(Number.parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="max-w-xs focus:ring-green-500"
                />
              </div>

              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>目前最低還款總額：NT${totalMinimumPayment.toLocaleString()}</span>
                </div>
                {extraPayment > 0 && (
                  <div className="text-sm text-green-700">
                    <strong>總還款金額：NT${(totalMinimumPayment + extraPayment).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Button */}
      {selectedStrategy && (
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3 text-lg hover:scale-105 transition-transform duration-200"
          >
            開始執行 {selectedStrategy === "snowball" ? "雪球法" : "雪崩法"} 策略
          </Button>
        </div>
      )}
    </div>
  )
}
