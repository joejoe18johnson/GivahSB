-- Campaign reference number: one per campaign, used for all donations to that campaign
alter table public.campaigns
  add column if not exists reference_number text;

-- Backfill existing campaigns with a unique ref from id (stable per campaign)
update public.campaigns
set reference_number = 'GV-' || upper(substr(replace(id::text, '-', ''), 1, 6))
where reference_number is null;

-- Ensure no nulls for new rows: default for future inserts (optional; app will set explicitly)
-- We keep it nullable for the backfill above; new campaigns get ref in application code
create unique index if not exists campaigns_reference_number_key
  on public.campaigns (reference_number)
  where reference_number is not null;

comment on column public.campaigns.reference_number is 'Single reference number for this campaign; used for all donations to this campaign.';
