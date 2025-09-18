-- DebtWise AI Database Schema
-- PostgreSQL Database Design

-- Users table - 用戶管理
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    profile_picture TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC'
);

-- Debts table - 債務管理
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    debt_name VARCHAR(200) NOT NULL,
    debt_type VARCHAR(50) NOT NULL, -- credit_card, personal_loan, mortgage, student_loan, other
    original_amount DECIMAL(12,2) NOT NULL,
    current_balance DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,4) NOT NULL, -- APR as decimal (e.g., 0.1850 for 18.50%)
    minimum_payment DECIMAL(10,2) NOT NULL,
    due_date INTEGER NOT NULL, -- Day of month (1-31)
    creditor_name VARCHAR(200),
    account_number_last4 VARCHAR(4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_off_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    priority_order INTEGER DEFAULT 1,
    notes TEXT
);

-- Payment History table - 還款記錄
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'regular', -- regular, extra, minimum
    interest_portion DECIMAL(10,2),
    principal_portion DECIMAL(10,2),
    remaining_balance DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Repayment Strategies table - 還款策略
CREATE TABLE repayment_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_name VARCHAR(100) NOT NULL,
    strategy_type VARCHAR(50) NOT NULL, -- snowball, avalanche, custom, ai_optimized
    total_extra_payment DECIMAL(10,2) DEFAULT 0,
    target_payoff_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT false,
    estimated_total_interest DECIMAL(12,2),
    estimated_payoff_months INTEGER,
    monthly_savings DECIMAL(10,2)
);

-- Strategy Debt Order table - 還款優先順序
CREATE TABLE strategy_debt_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES repayment_strategies(id) ON DELETE CASCADE,
    debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
    order_position INTEGER NOT NULL,
    allocated_extra_payment DECIMAL(10,2) DEFAULT 0,
    projected_payoff_date DATE,
    UNIQUE(strategy_id, debt_id),
    UNIQUE(strategy_id, order_position)
);

-- Financial Goals table - 財務目標
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- debt_free, emergency_fund, savings_target, investment
    goal_name VARCHAR(200) NOT NULL,
    target_amount DECIMAL(12,2),
    target_date DATE,
    current_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_achieved BOOLEAN DEFAULT false,
    achieved_date TIMESTAMP,
    priority INTEGER DEFAULT 1,
    notes TEXT
);

-- Notifications table - 通知系統
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- payment_reminder, goal_achieved, milestone_reached
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP,
    related_debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
    related_goal_id UUID REFERENCES financial_goals(id) ON DELETE SET NULL,
    action_url TEXT
);

-- User Preferences table - 用戶偏好設定
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    currency VARCHAR(3) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    notification_email BOOLEAN DEFAULT true,
    notification_push BOOLEAN DEFAULT true,
    reminder_days_before INTEGER DEFAULT 3,
    dashboard_widgets JSONB DEFAULT '[]',
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Snapshots table - 財務快照（用於趨勢分析）
CREATE TABLE financial_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_debt DECIMAL(12,2) NOT NULL,
    monthly_payment DECIMAL(10,2) NOT NULL,
    debt_to_income_ratio DECIMAL(5,4),
    credit_utilization DECIMAL(5,4),
    emergency_fund DECIMAL(12,2),
    net_worth DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_active ON debts(is_active) WHERE is_active = true;
CREATE INDEX idx_payment_history_debt_id ON payment_history(debt_id);
CREATE INDEX idx_payment_history_date ON payment_history(payment_date);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_financial_snapshots_user_date ON financial_snapshots(user_id, snapshot_date);

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON repayment_strategies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON financial_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();