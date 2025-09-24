import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { GoalFormData } from "@/lib/types/database"

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

    const { data: goals, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("獲取目標錯誤:", error)
      return NextResponse.json({ error: "獲取目標失敗" }, { status: 500 })
    }

    return NextResponse.json({ goals })
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

    const body: GoalFormData = await request.json()

    const { data: goal, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: body.title,
        target_amount: body.target_amount || null,
        target_date: body.target_date || null,
        goal_type: body.goal_type,
      })
      .select()
      .single()

    if (error) {
      console.error("建立目標錯誤:", error)
      return NextResponse.json({ error: "建立目標失敗" }, { status: 500 })
    }

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error("API錯誤:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}
