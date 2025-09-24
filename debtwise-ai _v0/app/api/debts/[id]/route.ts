import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { DebtFormData } from "@/lib/types/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 })
    }

    const { data: debt, error } = await supabase.from("debts").select("*").eq("id", id).eq("user_id", user.id).single()

    if (error) {
      console.error("獲取債務錯誤:", error)
      return NextResponse.json({ error: "債務不存在" }, { status: 404 })
    }

    return NextResponse.json({ debt })
  } catch (error) {
    console.error("API錯誤:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 })
    }

    const body: Partial<DebtFormData> = await request.json()

    const { data: debt, error } = await supabase
      .from("debts")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("更新債務錯誤:", error)
      return NextResponse.json({ error: "更新債務失敗" }, { status: 500 })
    }

    return NextResponse.json({ debt })
  } catch (error) {
    console.error("API錯誤:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 })
    }

    const { error } = await supabase.from("debts").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("刪除債務錯誤:", error)
      return NextResponse.json({ error: "刪除債務失敗" }, { status: 500 })
    }

    return NextResponse.json({ message: "債務已刪除" })
  } catch (error) {
    console.error("API錯誤:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}
