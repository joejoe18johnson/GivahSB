-- Contact form messages (from public contact page)
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Service role full access contact_messages"
  on public.contact_messages for all
  using (auth.jwt() ->> 'role' = 'service_role');
