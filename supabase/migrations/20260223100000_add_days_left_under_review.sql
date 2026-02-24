-- Add days_left to campaigns_under_review (0 = unlimited)
alter table public.campaigns_under_review
  add column if not exists days_left int not null default 30;
