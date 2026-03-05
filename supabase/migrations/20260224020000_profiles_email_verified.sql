-- Add email_verified to profiles so we can show/track email confirmation (works with Supabase auth.email_confirmed_at).
-- Verification can be done from any device via the link in the email.
alter table public.profiles
  add column if not exists email_verified boolean not null default false;

comment on column public.profiles.email_verified is 'True after user has confirmed their email via the link (synced with auth.users.email_confirmed_at).';
