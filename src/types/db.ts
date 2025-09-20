export type MembershipType = 'free' | 'premium';
export type DebtType =
  | 'credit_card'
  | 'auto_loan'
  | 'student_loan'
  | 'mortgage'
  | 'personal_loan'
  | 'medical_debt'
  | 'other';
export type DebtStatus = 'active' | 'paid_off' | 'closed';
export type PaymentType = 'regular' | 'extra' | 'minimum' | 'final';
export type StrategyType = 'snowball' | 'avalanche';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  membership_type: MembershipType;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  original_amount: number;
  interest_rate: number;
  minimum_payment: number;
  due_date?: string | null;
  debt_type: DebtType;
  status: DebtStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  payment_type: PaymentType;
  notes?: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  debt_id?: string | null;
  title: string;
  message?: string | null;
  reminder_type: 'due_date' | 'custom' | 'milestone' | 'strategy';
  reminder_date: string;
  is_completed: boolean;
  created_at: string;
}

export interface StrategySimulation {
  id: string;
  user_id: string;
  strategy_type: StrategyType;
  extra_payment: number;
  total_debt: number;
  months_to_payoff?: number | null;
  total_interest?: number | null;
  simulation_data?: unknown;
  created_at: string;
}
