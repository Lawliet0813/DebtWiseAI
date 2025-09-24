-- 建立目標設定表
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount decimal(12,2),
  target_date date,
  current_progress decimal(5,2) default 0,
  goal_type text not null check (goal_type in ('debt_free', 'emergency_fund', 'savings', 'custom')),
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 啟用行級安全性
alter table public.goals enable row level security;

-- 建立RLS政策
create policy "goals_select_own"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals_insert_own"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "goals_update_own"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "goals_delete_own"
  on public.goals for delete
  using (auth.uid() = user_id);
