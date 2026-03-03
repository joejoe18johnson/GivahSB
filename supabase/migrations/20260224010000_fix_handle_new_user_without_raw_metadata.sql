-- Final fix for handle_new_user trigger function.
-- This version no longer references auth.users raw_user_meta* columns at all,
-- so it works regardless of Supabase auth schema details.
-- It simply uses the user's email to derive a sensible default name.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_name text;
begin
  -- Derive a simple display name from the email (before '@') or fallback to 'User'
  base_name := coalesce(split_part(new.email, '@', 1), 'User');

  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    base_name
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, profiles.name),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

