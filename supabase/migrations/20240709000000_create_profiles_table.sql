-- Profiles table for application-specific user data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  membership_type text not null default 'free' check (membership_type in ('free', 'premium')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.profiles is 'Application user profiles tied to auth.users.';
comment on column public.profiles.full_name is 'Optional full name synced from auth metadata.';

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
