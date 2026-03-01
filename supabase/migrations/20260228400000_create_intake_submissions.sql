-- Intake form submissions — public-facing project intake questionnaire
-- Replaces the Google Form "New Launch Campaign"

create table if not exists public.intake_submissions (
  id            uuid primary key default gen_random_uuid(),

  -- Contact info
  name          text not null,
  email         text not null,
  title         text,                           -- their job title
  stakeholders  text,                           -- other team members / roles

  -- Project basics
  project_name  text not null,
  pitch         text not null,                  -- one-sentence description
  excitement    text,                           -- what excites them most
  key_feature   text,                           -- single most important feature/benefit
  vision        text,                           -- ideal video campaign vision
  avoid         text,                           -- what NOT to do
  audience      text,                           -- target audience
  challenge     text,                           -- biggest communication challenge
  competitors   text,                           -- top competitors

  -- Creative references
  video_links   text,                           -- links to videos they love + why

  -- Deliverables
  deliverables  text[] not null default '{}',   -- array of selected deliverable types
  deliverable_notes text,                       -- additional deliverable details

  -- Timeline
  timeline      text not null,                  -- 'asap' | 'soon' | 'later' | 'specific' | 'unsure'
  timeline_date date,                           -- if timeline = 'specific'
  timeline_notes text,

  -- Priorities
  priority_order text[] not null default '{}',  -- ordered: ['quality','speed','cost']

  -- Experience
  experience    text not null,                  -- 'none' | 'inhouse' | 'some' | 'experienced'
  experience_notes text,

  -- Partners & services
  partners      text[] not null default '{}',   -- selected partner types
  partner_details text,                         -- who the partners are

  -- Crowdfunding (optional)
  public_goal   text,
  internal_goal text,

  -- Budget
  budget        text,

  -- Email list size (for crowdfunding)
  email_list_size text,                         -- '0-100' | '100-500' | etc.

  -- Files
  file_urls     text[] not null default '{}',   -- storage URLs of uploaded files

  -- Additional
  anything_else text,
  referral      text,                           -- who referred them

  -- Linking to CRM
  client_id     uuid references public.clients(id) on delete set null,
  contact_id    uuid references public.contacts(id) on delete set null,
  project_id    uuid references public.projects(id) on delete set null,

  -- Meta
  status        text not null default 'new',    -- 'new' | 'reviewed' | 'converted' | 'archived'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Allow anonymous inserts (public form)
alter table public.intake_submissions enable row level security;

create policy "Anyone can insert intake submissions"
  on public.intake_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users (admins) can read/update
create policy "Authenticated users can read intake submissions"
  on public.intake_submissions
  for select
  to authenticated
  using (true);

create policy "Authenticated users can update intake submissions"
  on public.intake_submissions
  for update
  to authenticated
  using (true)
  with check (true);

-- Storage bucket for intake file uploads
insert into storage.buckets (id, name, public)
values ('intake-files', 'intake-files', true)
on conflict (id) do nothing;

-- Allow anonymous uploads to intake-files bucket
create policy "Anyone can upload intake files"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'intake-files');

-- Allow public reads on intake files
create policy "Public read access to intake files"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'intake-files');
