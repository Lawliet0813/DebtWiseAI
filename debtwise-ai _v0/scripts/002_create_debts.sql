-- 建立債務資料表
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit_card', 'personal_loan', 'mortgage', 'student_loan', 'car_loan', 'other')),
  total_amount decimal(12,2) not null,
  current_balance decimal(12,2) not null,
  interest_rate decimal(5,2) not null,
  minimum_payment decimal(10,2) not null,
  due_date date,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 啟用行級安全性
alter table public.debts enable row level security;

-- 建立RLS政策
create policy "debts_select_own"
  on public.debts for select
  using (auth.uid() = user_id);

create policy "debts_insert_own"
  on public.debts for insert
  with check (auth.uid() = user_id);

create policy "debts_update_own"
  on public.debts for update
  using (auth.uid() = user_id);

create policy "debts_delete_own"
  on public.debts for delete
  using (auth.uid() = user_id);
