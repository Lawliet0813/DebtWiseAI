"use client"

import { useState, useEffect } from "react"
import type { Debt } from "@/lib/types/database"

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDebts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/debts")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "獲取債務資料失敗")
      }

      setDebts(data.debts)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤")
    } finally {
      setIsLoading(false)
    }
  }

  const createDebt = async (debtData: Omit<Debt, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(debtData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "建立債務失敗")
      }

      await fetchDebts() // 重新獲取資料
      return data.debt
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "未知錯誤")
    }
  }

  const updateDebt = async (id: string, debtData: Partial<Debt>) => {
    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(debtData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "更新債務失敗")
      }

      await fetchDebts() // 重新獲取資料
      return data.debt
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "未知錯誤")
    }
  }

  const deleteDebt = async (id: string) => {
    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "刪除債務失敗")
      }

      await fetchDebts() // 重新獲取資料
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "未知錯誤")
    }
  }

  useEffect(() => {
    fetchDebts()
  }, [])

  return {
    debts,
    isLoading,
    error,
    fetchDebts,
    createDebt,
    updateDebt,
    deleteDebt,
  }
}
