-- GivahBz: initial schema for Supabase (replacing Firebase/Firestore)
-- Run in Supabase SQL Editor or via supabase db push

-- Profiles (extends auth.users; id = auth.uid())
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default 'User',
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'on_hold', 'deleted')),
  verified boolean not null default false,
  id_verified boolean not null default false,
  address_verified boolean not null default false,
  phone_number text,
  phone_verified boolean not null default false,
  phone_pending boolean not null default false,
  id_document text,
  id_document_type text check (id_document_type in ('social_security', 'passport')),
  id_pending boolean not null default false,
  address_document text,
  address_pending boolean not null default false,
  profile_photo text,
  hearted_campaigns uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Campaigns (live, public)
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  full_description text not null,
  creator text not null,
  creator_type text not null default 'individual' check (creator_type in ('individual', 'organization', 'charity')),
  creator_id uuid references auth.users(id) on delete set null,
  goal numeric not null default 0,
  raised numeric not null default 0,
  backers int not null default 0,
  days_left int not null default 30,
  category text not null,
  image text not null,
  image2 text,
  location text,
  status text not null default 'live' check (status in ('live', 'on_hold')),
  verified boolean not null default false,
  admin_backed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Campaigns under review (quarantine until approved)
create table if not exists public.campaigns_under_review (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  full_description text,
  goal numeric not null,
  category text not null,
  creator_name text not null,
  creator_id uuid not null references auth.users(id) on delete cascade,
  image text,
  image2 text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Donations
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  amount numeric not null,
  donor_email text,
  donor_name text,
  anonymous boolean not null default false,
  method text not null check (method in ('bank', 'digiwallet', 'ekyash')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  reference_number text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Site config (single row)
create table if not exists public.site_config (
  id text primary key default 'content',
  site_name text,
  hero_title text,
  hero_subtitle text,
  community_heading_part1 text,
  community_heading_part2 text,
  footer_tagline text,
  footer_copyright text,
  about_title text,
  about_subtitle text,
  about_mission text,
  home_faqs text,
  updated_at timestamptz not null default now()
);

-- Insert default site_config row
insert into public.site_config (id) values ('content') on conflict (id) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaigns_under_review enable row level security;
alter table public.donations enable row level security;
alter table public.notifications enable row level security;
alter table public.site_config enable row level security;

-- Profiles: users can read/update own
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Service role full access profiles" on public.profiles for all using (auth.jwt() ->> 'role' = 'service_role');

-- Campaigns: public read for live; service role write
create policy "Anyone can read live campaigns" on public.campaigns for select using (status = 'live' or status = 'on_hold');
create policy "Service role full access campaigns" on public.campaigns for all using (auth.jwt() ->> 'role' = 'service_role');

-- Campaigns under review: creator and service role
create policy "Users can read own under review" on public.campaigns_under_review for select using (auth.uid() = creator_id);
create policy "Users can insert own under review" on public.campaigns_under_review for insert with check (auth.uid() = creator_id);
create policy "Service role full access under review" on public.campaigns_under_review for all using (auth.jwt() ->> 'role' = 'service_role');

-- Donations: service role for admin; anon can insert (for creating pending donations)
create policy "Service role full access donations" on public.donations for all using (auth.jwt() ->> 'role' = 'service_role');
create policy "Authenticated can insert donations" on public.donations for insert with check (auth.role() = 'authenticated');

-- Notifications: user can read/update own
create policy "Users can read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Service role full access notifications" on public.notifications for all using (auth.jwt() ->> 'role' = 'service_role');

-- Site config: public read; service role write
create policy "Anyone can read site_config" on public.site_config for select using (true);
create policy "Service role full access site_config" on public.site_config for all using (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, profile_photo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', 'User'),
    new.raw_user_meta_data ->> 'avatar_url'
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

-- Storage buckets (create via Dashboard or API): profile-photos, campaigns, verification-docs
-- Optional: create buckets with RLS via SQL if your Supabase version supports it
