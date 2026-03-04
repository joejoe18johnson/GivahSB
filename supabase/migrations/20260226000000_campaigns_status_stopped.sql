-- Allow campaign status 'stopped' for fully funded and paid-out campaigns.
-- Stopped campaigns are read-only for creators (edit disabled; delete only).

-- Replace status check to include 'stopped'
alter table public.campaigns
  drop constraint if exists campaigns_status_check,
  add constraint campaigns_status_check check (status in ('live', 'on_hold', 'stopped'));

-- Allow reading stopped campaigns (so campaign page and creator's list work)
drop policy if exists "Anyone can read live campaigns" on public.campaigns;
create policy "Anyone can read live campaigns" on public.campaigns
  for select using (status = 'live' or status = 'on_hold' or status = 'stopped');
