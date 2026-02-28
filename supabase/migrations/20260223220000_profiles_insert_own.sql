-- Allow authenticated users to insert their own profile row (e.g. when hearting campaigns before profile exists from OAuth)
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
