-- Fix handle_new_user trigger function to use the current auth.users column name
-- (raw_user_metadata instead of the older raw_user_meta_data).
-- This resolves errors like: record "new" has no field "raw_user_meta_data".

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, profile_photo)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_metadata ->> 'name',
      new.raw_user_metadata ->> 'full_name',
      'User'
    ),
    new.raw_user_metadata ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, profiles.name),
    profile_photo = coalesce(excluded.profile_photo, profiles.profile_photo),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

