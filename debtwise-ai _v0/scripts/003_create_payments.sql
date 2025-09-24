-- 建立還款記錄表
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  amount decimal(10,2) not null,
  payment_date date not null,
  payment_type text not null check (payment_type in ('minimum', 'extra', 'full')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 啟用行級安全性
alter table public.payments enable row level security;

-- 建立RLS政策
create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "payments_insert_own"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "payments_update_own"
  on public.payments for update
  using (auth.uid() = user_id);

create policy "payments_delete_own"
  on public.payments for delete
  using (auth.uid() = user_id);
