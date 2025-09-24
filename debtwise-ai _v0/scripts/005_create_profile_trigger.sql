-- 建立自動建立用戶資料的觸發器
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 移除舊的觸發器（如果存在）
drop trigger if exists on_auth_user_created on auth.users;

-- 建立新的觸發器
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
