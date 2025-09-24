"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DebtFormData } from "@/lib/types/database"

interface AddDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddDebtDialog({ open, onOpenChange, onSuccess }: AddDebtDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<DebtFormData>({
    name: "",
    type: "credit_card",
    total_amount: 0,
    current_balance: 0,
    interest_rate: 0,
    minimum_payment: 0,
    due_date: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "建立債務失敗")
      }

      // 重置表單
      setFormData({
        name: "",
        type: "credit_card",
        total_amount: 0,
        current_balance: 0,
        interest_rate: 0,
        minimum_payment: 0,
        due_date: "",
        description: "",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增債務</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">債務名稱</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：信用卡A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">債務類型</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">信用卡</SelectItem>
                <SelectItem value="personal_loan">個人貸款</SelectItem>
                <SelectItem value="mortgage">房屋貸款</SelectItem>
                <SelectItem value="student_loan">學生貸款</SelectItem>
                <SelectItem value="car_loan">汽車貸款</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">總金額</Label>
              <Input
                id="total_amount"
                type="number"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_balance">目前餘額</Label>
              <Input
                id="current_balance"
                type="number"
                value={formData.current_balance}
                onChange={(e) => setFormData({ ...formData, current_balance: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest_rate">年利率 (%)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimum_payment">最低還款</Label>
              <Input
                id="minimum_payment"
                type="number"
                value={formData.minimum_payment}
                onChange={(e) => setFormData({ ...formData, minimum_payment: Number(e.target.value) })}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">到期日</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">備註</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="額外說明..."
              rows={3}
            />
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "建立中..." : "建立債務"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
