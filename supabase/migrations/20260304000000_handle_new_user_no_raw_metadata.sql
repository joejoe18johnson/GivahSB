-- Ensure handle_new_user does not reference raw_user_metadata.
-- Fixes: record "new" has no field "raw_user_metadata" (e.g. when hearting and profile is created).
-- Use only new.id and new.email so the trigger works on auth.users regardless of schema.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_name text;
begin
  base_name := coalesce(nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), ''), 'User');

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
