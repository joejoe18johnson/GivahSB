-- Payout requests: campaign creator requests withdrawal to a Belize bank account
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  bank_name text not null,
  account_type text not null check (account_type in ('savings', 'checking')),
  account_number text not null,
  account_holder_name text not null,
  branch text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id)
);

comment on table public.payout_requests is 'Creator requests to withdraw campaign funds to a Belize bank account; one request per campaign.';

alter table public.payout_requests enable row level security;

create policy "Users can read own payout requests"
  on public.payout_requests for select
  using (auth.uid() = user_id);

create policy "Users can insert own payout requests"
  on public.payout_requests for insert
  with check (auth.uid() = user_id);

create policy "Service role full access payout_requests"
  on public.payout_requests for all
  using (auth.jwt() ->> 'role' = 'service_role');
