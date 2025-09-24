"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calculator, Compass as Compare, BookOpen, Star } from "lucide-react"

interface CalculatorResult {
  monthlyPayment?: number
  totalInterest?: number
  payoffTime?: number
  totalAmount?: number
}

interface ComparisonOption {
  name: string
  interestRate: number
  monthlyPayment: number
  totalCost: number
  payoffTime: number
  rating: number
}

export function ToolsCenter() {
  const [activeCalculator, setActiveCalculator] = useState("loan")
  const [calculatorInputs, setCalculatorInputs] = useState({
    principal: 0,
    interestRate: 0,
    term: 0,
    monthlyPayment: 0,
  })
  const [calculatorResult, setCalculatorResult] = useState<CalculatorResult>({})

  const tools = [
    {
      id: "calculators",
      title: "財務計算器",
      description: "各種貸款與還款計算工具",
      icon: "🧮",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "comparison",
      title: "方案比較",
      description: "比較不同貸款或還款方案",
      icon: "⚖️",
      color: "from-green-500 to-green-600",
    },
    {
      id: "education",
      title: "理財教育",
      description: "學習債務管理與理財知識",
      icon: "📚",
      color: "from-purple-500 to-purple-600",
    },
  ]

  const educationArticles = [
    {
      id: "1",
      title: "債務雪球法 vs 雪崩法：哪種更適合你？",
      summary: "深入比較兩種主流還款策略的優缺點",
      category: "策略",
      difficulty: "初級",
      readTime: "5 分鐘",
      emoji: "❄️",
    },
    {
      id: "2",
      title: "如何建立緊急預備金",
      summary: "學習建立財務安全網的重要性與方法",
      category: "理財",
      difficulty: "初級",
      readTime: "8 分鐘",
      emoji: "🛡️",
    },
    {
      id: "3",
      title: "信用評分對貸款利率的影響",
      summary: "了解信用評分如何影響您的借貸成本",
      category: "信用",
      difficulty: "中級",
      readTime: "10 分鐘",
      emoji: "📊",
    },
    {
      id: "4",
      title: "債務整合的利弊分析",
      summary: "評估債務整合是否適合您的財務狀況",
      category: "策略",
      difficulty: "中級",
      readTime: "12 分鐘",
      emoji: "🔄",
    },
  ]

  const comparisonOptions: ComparisonOption[] = [
    {
      name: "銀行 A 個人貸款",
      interestRate: 8.5,
      monthlyPayment: 8500,
      totalCost: 1020000,
      payoffTime: 120,
      rating: 4.2,
    },
    {
      name: "銀行 B 個人貸款",
      interestRate: 9.2,
      monthlyPayment: 8800,
      totalCost: 1056000,
      payoffTime: 120,
      rating: 3.8,
    },
    {
      name: "信用合作社貸款",
      interestRate: 7.8,
      monthlyPayment: 8200,
      totalCost: 984000,
      payoffTime: 120,
      rating: 4.5,
    },
  ]

  const calculateLoan = () => {
    const { principal, interestRate, term } = calculatorInputs
    if (principal && interestRate && term) {
      const monthlyRate = interestRate / 100 / 12
      const numPayments = term
      const monthlyPayment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      const totalAmount = monthlyPayment * numPayments
      const totalInterest = totalAmount - principal

      setCalculatorResult({
        monthlyPayment: Math.round(monthlyPayment),
        totalInterest: Math.round(totalInterest),
        totalAmount: Math.round(totalAmount),
        payoffTime: term,
      })
    }
  }

  const handleInputChange = (field: string, value: number) => {
    setCalculatorInputs((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🛠️</span>
          工具中心
        </h1>
        <p className="text-gray-600">實用的財務計算與分析工具</p>
      </div>

      {/* Tool Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.id} className="glass p-6 hover:scale-105 transition-transform duration-200 cursor-pointer">
            <div className="text-center space-y-3">
              <div className="text-4xl">{tool.icon}</div>
              <h3 className="font-bold text-gray-800">{tool.title}</h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
              <Button className={`w-full bg-gradient-to-r ${tool.color} hover:opacity-90`}>使用工具</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Tools Interface */}
      <Tabs defaultValue="calculators" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 glass">
          <TabsTrigger
            value="calculators"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            計算器
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white"
          >
            方案比較
          </TabsTrigger>
          <TabsTrigger
            value="education"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            理財教育
          </TabsTrigger>
        </TabsList>

        {/* Calculators Tab */}
        <TabsContent value="calculators" className="space-y-6">
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">貸款計算器</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">貸款本金 (NT$)</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={calculatorInputs.principal || ""}
                    onChange={(e) => handleInputChange("principal", Number.parseFloat(e.target.value) || 0)}
                    placeholder="例如：1000000"
                    className="focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate">年利率 (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={calculatorInputs.interestRate || ""}
                    onChange={(e) => handleInputChange("interestRate", Number.parseFloat(e.target.value) || 0)}
                    placeholder="例如：5.5"
                    className="focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term">貸款期數 (月)</Label>
                  <Input
                    id="term"
                    type="number"
                    value={calculatorInputs.term || ""}
                    onChange={(e) => handleInputChange("term", Number.parseInt(e.target.value) || 0)}
                    placeholder="例如：240"
                    className="focus:ring-blue-500"
                  />
                </div>

                <Button
                  onClick={calculateLoan}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  計算
                </Button>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">計算結果</h3>
                {calculatorResult.monthlyPayment ? (
                  <div className="space-y-4">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">
                          NT${calculatorResult.monthlyPayment?.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600">月還款金額</div>
                      </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-3 text-center">
                        <div className="font-bold text-gray-800">
                          NT${calculatorResult.totalInterest?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">總利息</div>
                      </Card>
                      <Card className="p-3 text-center">
                        <div className="font-bold text-gray-800">
                          NT${calculatorResult.totalAmount?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">總還款</div>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card className="p-8 text-center bg-gray-50">
                    <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">輸入貸款資訊開始計算</p>
                  </Card>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <Compare className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-800">貸款方案比較</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-800">方案名稱</th>
                    <th className="text-right p-3 font-medium text-gray-800">利率</th>
                    <th className="text-right p-3 font-medium text-gray-800">月還款</th>
                    <th className="text-right p-3 font-medium text-gray-800">總成本</th>
                    <th className="text-center p-3 font-medium text-gray-800">評等</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonOptions.map((option, index) => (
                    <tr key={option.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{option.name}</span>
                          {index === 2 && <Badge className="bg-green-500 text-white text-xs">最佳選擇</Badge>}
                        </div>
                      </td>
                      <td className="text-right p-3 font-medium">{option.interestRate}%</td>
                      <td className="text-right p-3">NT${option.monthlyPayment.toLocaleString()}</td>
                      <td className="text-right p-3">NT${option.totalCost.toLocaleString()}</td>
                      <td className="text-center p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{option.rating}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6">
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">理財教育中心</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {educationArticles.map((article) => (
                <Card
                  key={article.id}
                  className="glass p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{article.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{article.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.summary}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {article.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {article.readTime}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-6">
              <Button variant="outline" className="bg-transparent hover:bg-purple-50 border-purple-200 text-purple-700">
                查看更多文章
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
