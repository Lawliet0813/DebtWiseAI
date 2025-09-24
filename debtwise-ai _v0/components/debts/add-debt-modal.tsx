"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface Debt {
  name: string
  type: "credit-card" | "mortgage" | "auto" | "student" | "personal" | "investment" | "business" | "other"
  balance: number
  originalAmount: number
  interestRate: number
  minimumPayment: number
  dueDate: string
  term?: number
}

interface AddDebtModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (debt: Debt) => void
}

const debtTypes = [
  { value: "credit-card", label: "💳 信用卡", needsTerm: false },
  { value: "mortgage", label: "🏠 房屋貸款", needsTerm: true },
  { value: "auto", label: "🚗 汽車貸款", needsTerm: true },
  { value: "student", label: "🎓 學生貸款", needsTerm: true },
  { value: "personal", label: "💰 個人貸款", needsTerm: true },
  { value: "investment", label: "📈 投資", needsTerm: false },
  { value: "business", label: "🏢 企業", needsTerm: false },
  { value: "other", label: "📋 其他", needsTerm: false },
]

export function AddDebtModal({ isOpen, onClose, onAdd }: AddDebtModalProps) {
  const [formData, setFormData] = useState<Debt>({
    name: "",
    type: "credit-card",
    balance: 0,
    originalAmount: 0,
    interestRate: 0,
    minimumPayment: 0,
    dueDate: "",
    term: undefined,
  })

  const selectedDebtType = debtTypes.find((type) => type.value === formData.type)
  const needsTerm = selectedDebtType?.needsTerm || false

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.dueDate || formData.balance <= 0) {
      return
    }

    onAdd(formData)

    // Reset form
    setFormData({
      name: "",
      type: "credit-card",
      balance: 0,
      originalAmount: 0,
      interestRate: 0,
      minimumPayment: 0,
      dueDate: "",
      term: undefined,
    })
  }

  const handleInputChange = (field: keyof Debt, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="gradient-text">新增債務項目</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Debt Name */}
          <div className="space-y-2">
            <Label htmlFor="name">債務名稱</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="例如：信用卡 A"
              className="w-full focus:ring-purple-500"
              required
            />
          </div>

          {/* Debt Type */}
          <div className="space-y-2">
            <Label htmlFor="type">債務類型</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value as Debt["type"])}>
              <SelectTrigger className="w-full focus:ring-purple-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {debtTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Balance */}
          <div className="space-y-2">
            <Label htmlFor="balance">目前餘額 (NT$)</Label>
            <Input
              id="balance"
              type="number"
              value={formData.balance || ""}
              onChange={(e) => handleInputChange("balance", Number.parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full focus:ring-purple-500"
              required
            />
          </div>

          {/* Original Amount */}
          <div className="space-y-2">
            <Label htmlFor="originalAmount">原始金額 (NT$)</Label>
            <Input
              id="originalAmount"
              type="number"
              value={formData.originalAmount || ""}
              onChange={(e) => handleInputChange("originalAmount", Number.parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full focus:ring-purple-500"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <Label htmlFor="interestRate">利率 (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              value={formData.interestRate || ""}
              onChange={(e) => handleInputChange("interestRate", Number.parseFloat(e.target.value) || 0)}
              placeholder="0.0"
              className="w-full focus:ring-purple-500"
            />
          </div>

          {/* Minimum Payment */}
          <div className="space-y-2">
            <Label htmlFor="minimumPayment">最低還款額 (NT$)</Label>
            <Input
              id="minimumPayment"
              type="number"
              value={formData.minimumPayment || ""}
              onChange={(e) => handleInputChange("minimumPayment", Number.parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full focus:ring-purple-500"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">到期日</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange("dueDate", e.target.value)}
              className="w-full focus:ring-purple-500"
              required
            />
          </div>

          {/* Term (conditional) */}
          {needsTerm && (
            <div className="space-y-2">
              <Label htmlFor="term">貸款期數</Label>
              <Input
                id="term"
                type="number"
                value={formData.term || ""}
                onChange={(e) => handleInputChange("term", Number.parseInt(e.target.value) || undefined)}
                placeholder="例如：240 (20年)"
                className="w-full focus:ring-purple-500"
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-transform duration-200"
          >
            新增債務
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
