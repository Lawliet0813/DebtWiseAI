-- Create profiles table to store application-specific user data
create extension if not exists "pgcrypto";
create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  password_hash text not null,
  name text default '' not null,
  income numeric default 0 not null,
  expenses numeric default 0 not null,
  reminder_preferences jsonb not null default jsonb_build_object(
    'daysBeforeDue', 3,
    'timeOfDay', '09:00'
  ),
  membership text not null default 'free' check (membership in ('free', 'premium')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'DebtWise user profiles with budgeting preferences and membership data.';

-- keep reminder preferences json schema minimal validation
comment on column public.profiles.reminder_preferences is 'JSON blob storing reminder settings such as daysBeforeDue and timeOfDay.';

alter table public.profiles enable row level security;

create policy "Service role full access" on public.profiles
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Users can view own profile" on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert
  with check (auth.uid() = id);

create or replace function public.handle_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_profiles_updated_at();
