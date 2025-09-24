"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { PaymentFormData, Debt } from "@/lib/types/database"

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddPaymentDialog({ open, onOpenChange, onSuccess }: AddPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debts, setDebts] = useState<Debt[]>([])
  const [formData, setFormData] = useState<PaymentFormData>({
    debt_id: "",
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_type: "minimum",
    notes: "",
  })

  const fetchDebts = async () => {
    try {
      const response = await fetch("/api/debts")
      const data = await response.json()
      if (response.ok) {
        setDebts(data.debts)
      }
    } catch (err) {
      console.error("獲取債務列表失敗:", err)
    }
  }

  useEffect(() => {
    if (open) {
      fetchDebts()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "記錄還款失敗")
      }

      // 重置表單
      setFormData({
        debt_id: "",
        amount: 0,
        payment_date: new Date().toISOString().split("T")[0],
        payment_type: "minimum",
        notes: "",
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>記錄還款</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debt_id">選擇債務</Label>
            <Select value={formData.debt_id} onValueChange={(value) => setFormData({ ...formData, debt_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="選擇要還款的債務" />
              </SelectTrigger>
              <SelectContent>
                {debts.map((debt) => (
                  <SelectItem key={debt.id} value={debt.id}>
                    {debt.name} (餘額: NT${debt.current_balance.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">還款金額</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">還款日期</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_type">還款類型</Label>
            <Select
              value={formData.payment_type}
              onValueChange={(value: any) => setFormData({ ...formData, payment_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimum">最低還款</SelectItem>
                <SelectItem value="extra">額外還款</SelectItem>
                <SelectItem value="full">全額還清</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備註</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="額外說明..."
              rows={3}
            />
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading || !formData.debt_id}>
              {isLoading ? "記錄中..." : "記錄還款"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
