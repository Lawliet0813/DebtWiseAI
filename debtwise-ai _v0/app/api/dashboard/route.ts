import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import {
  calculateTotalDebt,
  calculateMonthlyMinimum,
  calculateWeightedInterestRate,
} from "@/lib/utils/debt-calculations"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 })
    }

    // 獲取債務資料
    const { data: debts, error: debtsError } = await supabase.from("debts").select("*").eq("user_id", user.id)

    if (debtsError) {
      console.error("獲取債務資料錯誤:", debtsError)
      return NextResponse.json({ error: "獲取資料失敗" }, { status: 500 })
    }

    // 獲取最近的還款記錄
    const { data: recentPayments, error: paymentsError } = await supabase
      .from("payments")
      .select(`
        *,
        debts!inner(name, type)
      `)
      .eq("user_id", user.id)
      .order("payment_date", { ascending: false })
      .limit(5)

    if (paymentsError) {
      console.error("獲取還款記錄錯誤:", paymentsError)
    }

    // 獲取目標
    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .order("created_at", { ascending: false })
      .limit(3)

    if (goalsError) {
      console.error("獲取目標錯誤:", goalsError)
    }

    // 計算統計資料
    const totalDebt = calculateTotalDebt(debts || [])
    const monthlyMinimum = calculateMonthlyMinimum(debts || [])
    const avgInterestRate = calculateWeightedInterestRate(debts || [])

    // 計算本月還款總額
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data: monthlyPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("user_id", user.id)
      .gte("payment_date", `${currentMonth}-01`)
      .lt("payment_date", `${currentMonth}-32`)

    const monthlyPaid = monthlyPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    return NextResponse.json({
      summary: {
        totalDebt,
        monthlyMinimum,
        avgInterestRate,
        monthlyPaid,
        debtCount: debts?.length || 0,
      },
      debts: debts || [],
      recentPayments: recentPayments || [],
      goals: goals || [],
    })
  } catch (error) {
    console.error("API錯誤:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}
