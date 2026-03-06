-- Add is_little_warriors flag for campaigns benefiting children ages 0-12 (Little Warriors category)
alter table public.campaigns_under_review
  add column if not exists is_little_warriors boolean not null default false;

alter table public.campaigns
  add column if not exists is_little_warriors boolean not null default false;

comment on column public.campaigns_under_review.is_little_warriors is 'True when beneficiaries are children ages 0-12 (Little Warriors category).';
comment on column public.campaigns.is_little_warriors is 'True when beneficiaries are children ages 0-12 (Little Warriors category).';
