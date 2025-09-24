import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { PaymentFormData } from "@/lib/types/database"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const debtId = searchParams.get("debt_id")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 })
    }

    let query = supabase
      .from("payments")
      .select(`
        *,
        debts!inner(name, type)
      `)
      .eq("user_id", user.id)
      .order("payment_date", { ascending: false })

    if (debtId) {
      query = query.eq("debt_id", debtId)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error("獲取還款記錄錯誤:", error)
      return NextResponse.json({ error: "獲取還款記錄失敗" }, { status: 500 })
    }

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("API錯誤:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 })
    }

    const body: PaymentFormData = await request.json()

    // 驗證債務是否屬於當前用戶
    const { data: debt, error: debtError } = await supabase
      .from("debts")
      .select("id, current_balance")
      .eq("id", body.debt_id)
      .eq("user_id", user.id)
      .single()

    if (debtError || !debt) {
      return NextResponse.json({ error: "債務不存在" }, { status: 404 })
    }

    // 建立還款記錄
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        debt_id: body.debt_id,
        amount: body.amount,
        payment_date: body.payment_date,
        payment_type: body.payment_type,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (paymentError) {
      console.error("建立還款記錄錯誤:", paymentError)
      return NextResponse.json({ error: "建立還款記錄失敗" }, { status: 500 })
    }

    // 更新債務餘額
    const newBalance = Math.max(0, debt.current_balance - body.amount)
    const { error: updateError } = await supabase
      .from("debts")
      .update({
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.debt_id)

    if (updateError) {
      console.error("更新債務餘額錯誤:", updateError)
      // 不返回錯誤，因為還款記錄已經建立
    }

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error("API錯誤:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}
