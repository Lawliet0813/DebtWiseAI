"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Target, Award, Calendar } from "lucide-react"

interface Debt {
  id: string
  name: string
  type: string
  originalAmount: number
  currentBalance: number
  paidAmount: number
  progress: number
}

interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  unlocked: boolean
  unlockedDate?: string
}

interface Goal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  completed: boolean
}

export function ProgressTracking() {
  // Mock data - in real app this would come from state/API
  const overallProgress = {
    totalOriginal: 3485000,
    totalPaid: 1220000,
    totalRemaining: 2265000,
    progressPercentage: 35,
  }

  const debts: Debt[] = [
    {
      id: "1",
      name: "信用卡 A",
      type: "💳",
      originalAmount: 120000,
      currentBalance: 85000,
      paidAmount: 35000,
      progress: 29,
    },
    {
      id: "2",
      name: "個人貸款",
      type: "💰",
      originalAmount: 200000,
      currentBalance: 150000,
      paidAmount: 50000,
      progress: 25,
    },
    {
      id: "3",
      name: "汽車貸款",
      type: "🚗",
      originalAmount: 800000,
      currentBalance: 450000,
      paidAmount: 350000,
      progress: 44,
    },
    {
      id: "4",
      name: "房屋貸款",
      type: "🏠",
      originalAmount: 3500000,
      currentBalance: 2800000,
      paidAmount: 700000,
      progress: 20,
    },
  ]

  const goals: Goal[] = [
    {
      id: "1",
      title: "清償信用卡債務",
      targetAmount: 85000,
      currentAmount: 35000,
      targetDate: "2025-06-30",
      completed: false,
    },
    {
      id: "2",
      title: "償還個人貸款",
      targetAmount: 150000,
      currentAmount: 50000,
      targetDate: "2025-12-31",
      completed: false,
    },
    {
      id: "3",
      title: "月還款目標",
      targetAmount: 50000,
      currentAmount: 40000,
      targetDate: "2025-01-31",
      completed: true,
    },
  ]

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "首次還款",
      description: "完成第一筆債務還款",
      emoji: "🎉",
      unlocked: true,
      unlockedDate: "2024-12-01",
    },
    {
      id: "2",
      title: "連續還款",
      description: "連續 3 個月按時還款",
      emoji: "🔥",
      unlocked: true,
      unlockedDate: "2024-12-15",
    },
    {
      id: "3",
      title: "債務殺手",
      description: "完全清償一筆債務",
      emoji: "⚡",
      unlocked: false,
    },
    {
      id: "4",
      title: "節約達人",
      description: "單月額外還款超過目標",
      emoji: "💎",
      unlocked: true,
      unlockedDate: "2025-01-10",
    },
    {
      id: "5",
      title: "策略大師",
      description: "使用還款策略 6 個月",
      emoji: "🏆",
      unlocked: false,
    },
    {
      id: "6",
      title: "自由之路",
      description: "清償 50% 總債務",
      emoji: "🌟",
      unlocked: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>📈</span>
          進度追蹤
        </h1>
        <p className="text-gray-600">追蹤您的債務償還進度與成就</p>
      </div>

      {/* Overall Progress Card */}
      <Card className="glass p-6 bg-gradient-to-r from-green-500 to-blue-500 text-white border-0">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6" />
          <h2 className="text-xl font-bold">整體進度</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{overallProgress.progressPercentage}%</div>
            <div className="text-sm text-white/80">完成度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">NT${(overallProgress.totalPaid / 1000).toFixed(0)}K</div>
            <div className="text-sm text-white/80">已償還</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">NT${(overallProgress.totalRemaining / 1000).toFixed(0)}K</div>
            <div className="text-sm text-white/80">剩餘債務</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">NT${(overallProgress.totalOriginal / 1000).toFixed(0)}K</div>
            <div className="text-sm text-white/80">原始總額</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>總體進度</span>
            <span>{overallProgress.progressPercentage}%</span>
          </div>
          <Progress value={overallProgress.progressPercentage} className="h-4 bg-white/20" />
        </div>
      </Card>

      {/* Individual Debt Progress */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span>
          個別債務進度
        </h2>
        <div className="space-y-4">
          {debts.map((debt) => (
            <Card key={debt.id} className="glass p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{debt.type}</span>
                  <div>
                    <h3 className="font-medium text-gray-800">{debt.name}</h3>
                    <div className="text-sm text-gray-600">
                      已還 NT${debt.paidAmount.toLocaleString()} / 剩餘 NT${debt.currentBalance.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">{debt.progress}%</div>
                </div>
              </div>
              <Progress value={debt.progress} className="h-3" />
            </Card>
          ))}
        </div>
      </div>

      {/* Goals and Targets */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          目標與里程碑
        </h2>
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            return (
              <Card
                key={goal.id}
                className={`glass p-4 ${goal.completed ? "bg-green-50 border-green-200" : "bg-gray-50"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${goal.completed ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <h3 className="font-medium text-gray-800">{goal.title}</h3>
                      <div className="text-sm text-gray-600">目標日期: {goal.targetDate}</div>
                    </div>
                  </div>
                  {goal.completed && (
                    <Badge className="bg-green-500 text-white">
                      <Award className="h-3 w-3 mr-1" />
                      已完成
                    </Badge>
                  )}
                </div>
                {!goal.completed && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        NT${goal.currentAmount.toLocaleString()} / NT${goal.targetAmount.toLocaleString()}
                      </span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          成就徽章
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`glass p-4 text-center transition-all duration-200 ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:scale-105"
                  : "bg-gray-50 opacity-60"
              }`}
            >
              <div className={`text-4xl mb-2 ${achievement.unlocked ? "" : "grayscale"}`}>{achievement.emoji}</div>
              <h3 className={`font-bold mb-1 ${achievement.unlocked ? "text-gray-800" : "text-gray-500"}`}>
                {achievement.title}
              </h3>
              <p className={`text-xs mb-2 ${achievement.unlocked ? "text-gray-600" : "text-gray-400"}`}>
                {achievement.description}
              </p>
              {achievement.unlocked && achievement.unlockedDate && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{achievement.unlockedDate}</span>
                </div>
              )}
              {!achievement.unlocked && (
                <Badge variant="outline" className="text-xs">
                  未解鎖
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <Button
          size="lg"
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8 py-3 text-lg hover:scale-105 transition-transform duration-200"
        >
          <TrendingUp className="h-5 w-5 mr-2" />
          查看詳細分析
        </Button>
      </div>
    </div>
  )
}
