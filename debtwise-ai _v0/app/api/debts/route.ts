import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { DebtFormData } from "@/lib/types/database"

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

    const { data: debts, error } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("獲取債務資料錯誤:", error)
      return NextResponse.json({ error: "獲取債務資料失敗" }, { status: 500 })
    }

    return NextResponse.json({ debts })
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

    const body: DebtFormData = await request.json()

    const { data: debt, error } = await supabase
      .from("debts")
      .insert({
        user_id: user.id,
        name: body.name,
        type: body.type,
        total_amount: body.total_amount,
        current_balance: body.current_balance,
        interest_rate: body.interest_rate,
        minimum_payment: body.minimum_payment,
        due_date: body.due_date || null,
        description: body.description || null,
      })
      .select()
      .single()

    if (error) {
      console.error("建立債務錯誤:", error)
      return NextResponse.json({ error: "建立債務失敗" }, { status: 500 })
    }

    return NextResponse.json({ debt }, { status: 201 })
  } catch (error) {
    console.error("API錯誤:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}
