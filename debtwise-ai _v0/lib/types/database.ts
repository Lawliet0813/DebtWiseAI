// 資料庫類型定義
export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Debt {
  id: string
  user_id: string
  name: string
  type: "credit_card" | "personal_loan" | "mortgage" | "student_loan" | "car_loan" | "other"
  total_amount: number
  current_balance: number
  interest_rate: number
  minimum_payment: number
  due_date: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  debt_id: string
  amount: number
  payment_date: string
  payment_type: "minimum" | "extra" | "full"
  notes: string | null
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number | null
  target_date: string | null
  current_progress: number
  goal_type: "debt_free" | "emergency_fund" | "savings" | "custom"
  is_completed: boolean
  created_at: string
  updated_at: string
}

// 表單類型定義
export interface DebtFormData {
  name: string
  type: Debt["type"]
  total_amount: number
  current_balance: number
  interest_rate: number
  minimum_payment: number
  due_date?: string
  description?: string
}

export interface PaymentFormData {
  debt_id: string
  amount: number
  payment_date: string
  payment_type: Payment["payment_type"]
  notes?: string
}

export interface GoalFormData {
  title: string
  target_amount?: number
  target_date?: string
  goal_type: Goal["goal_type"]
}
