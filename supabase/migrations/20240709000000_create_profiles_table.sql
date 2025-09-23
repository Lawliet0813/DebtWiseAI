-- Profiles table for application-specific user data without duplicating auth emails
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  password_hash text,
  income numeric not null default 0,
  expenses numeric not null default 0,
  reminder_preferences jsonb not null default jsonb_build_object(
    'daysBeforeDue', 3,
    'timeOfDay', '09:00'
  ),
  membership_type text not null default 'free' check (membership_type in ('free', 'premium')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'Application user profiles tied to auth.users.';
comment on column public.profiles.full_name is 'Optional full name synced from auth metadata.';
comment on column public.profiles.reminder_preferences is 'JSON blob storing reminder settings such as daysBeforeDue and timeOfDay.';

-- Ensure legacy columns are aligned with the new schema
alter table public.profiles drop column if exists email;

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists password_hash text;

alter table public.profiles add column if not exists income numeric;
alter table public.profiles alter column income set default 0;
update public.profiles set income = 0 where income is null;
alter table public.profiles alter column income set not null;

alter table public.profiles add column if not exists expenses numeric;
alter table public.profiles alter column expenses set default 0;
update public.profiles set expenses = 0 where expenses is null;
alter table public.profiles alter column expenses set not null;

alter table public.profiles add column if not exists reminder_preferences jsonb;
alter table public.profiles alter column reminder_preferences set default jsonb_build_object(
  'daysBeforeDue', 3,
  'timeOfDay', '09:00'
);
update public.profiles
set reminder_preferences = jsonb_build_object('daysBeforeDue', 3, 'timeOfDay', '09:00')
where reminder_preferences is null;
alter table public.profiles alter column reminder_preferences set not null;

alter table public.profiles add column if not exists membership_type text;
update public.profiles
set membership_type = 'free'
where membership_type is null
   or membership_type not in ('free', 'premium');
alter table public.profiles alter column membership_type set default 'free';
alter table public.profiles alter column membership_type set not null;
alter table public.profiles drop constraint if exists profiles_membership_type_check;
alter table public.profiles add constraint profiles_membership_type_check check (membership_type in ('free', 'premium'));

alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles alter column created_at set default timezone('utc', now());
update public.profiles set created_at = timezone('utc', now()) where created_at is null;
alter table public.profiles alter column created_at set not null;

alter table public.profiles add column if not exists updated_at timestamptz;
alter table public.profiles alter column updated_at set default timezone('utc', now());
update public.profiles set updated_at = timezone('utc', now()) where updated_at is null;
alter table public.profiles alter column updated_at set not null;

alter table public.profiles enable row level security;

drop policy if exists "Profiles are selectable by owners" on public.profiles;
create policy "Profiles are selectable by owners" on public.profiles
  for select
  using (auth.role() = 'service_role' or auth.uid() = id);

drop policy if exists "Profiles are insertable by owners" on public.profiles;
create policy "Profiles are insertable by owners" on public.profiles
  for insert
  with check (auth.role() = 'service_role' or auth.uid() = id);

drop policy if exists "Profiles are updatable by owners" on public.profiles;
create policy "Profiles are updatable by owners" on public.profiles
  for update
  using (auth.role() = 'service_role' or auth.uid() = id)
  with check (auth.role() = 'service_role' or auth.uid() = id);

create or replace function public.handle_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_profiles_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    )
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
