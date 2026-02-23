-- Pricing calculator lead capture
-- Rows inserted when a visitor fills out the interaction gate modal (source='gate')
-- and again if they change contact details in the Save Quote modal (source='save_quote').

create table public.pricing_leads (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  email         text        not null,
  timeline      text        not null,  -- 'asap' | 'soon' | 'later' | 'specific' | 'unsure'
  timeline_date date,                  -- populated only when timeline = 'specific'
  source        text        not null default 'gate',  -- 'gate' | 'save_quote'
  created_at    timestamptz not null default now()
);

-- Allow anonymous inserts (front-end uses anon key)
alter table public.pricing_leads enable row level security;

create policy "anon can insert pricing leads"
  on public.pricing_leads
  for insert
  to anon
  with check (true);
