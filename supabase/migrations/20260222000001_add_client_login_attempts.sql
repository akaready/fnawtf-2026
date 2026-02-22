-- Client portal login attempt tracking
-- Every submission from the Client Login modal is stored here.
-- No authentication is performed — attempts are stored for admin review only.

create table public.client_login_attempts (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  email           text        not null,
  portal_password text        not null,
  attempted_at    timestamptz not null default now()
);

-- Allow anonymous inserts (front-end uses anon key)
alter table public.client_login_attempts enable row level security;

create policy "anon can insert login attempts"
  on public.client_login_attempts
  for insert
  to anon
  with check (true);
