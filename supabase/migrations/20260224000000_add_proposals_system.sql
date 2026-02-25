-- ============================================================
-- PROPOSAL GENERATOR SYSTEM
-- Content snippets, proposals, sections, videos, projects,
-- quotes, and view tracking
-- ============================================================

-- Content snippets library (reusable text blocks for proposals)
create table public.content_snippets (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  body            text        not null default '',
  snippet_type    text        not null default 'general',
  category        text        not null default 'custom',
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Core proposals table
create table public.proposals (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  slug                text        not null unique,
  client_name         text        not null,
  client_email        text,
  client_company      text,
  proposal_password   text        not null,
  proposal_type       text        not null default 'build',
  tagline             text,
  status              text        not null default 'draft',
  proposal_number     serial,
  created_by          uuid        references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Ordered content sections within a proposal
create table public.proposal_sections (
  id              uuid        primary key default gen_random_uuid(),
  proposal_id     uuid        not null references public.proposals(id) on delete cascade,
  section_type    text        not null,
  snippet_id      uuid        references public.content_snippets(id) on delete set null,
  custom_content  text,
  custom_title    text,
  layout_columns  integer     not null default 1,
  layout_position text        not null default 'full',
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now()
);

-- Videos selected for proposal sections (references EXISTING project_videos)
create table public.proposal_videos (
  id                uuid        primary key default gen_random_uuid(),
  proposal_id       uuid        not null references public.proposals(id) on delete cascade,
  section_id        uuid        not null references public.proposal_sections(id) on delete cascade,
  project_video_id  uuid        not null references public.project_videos(id) on delete cascade,
  sort_order        integer     not null default 0
);

-- Projects featured in a proposal
create table public.proposal_projects (
  id              uuid        primary key default gen_random_uuid(),
  proposal_id     uuid        not null references public.proposals(id) on delete cascade,
  section_id      uuid        references public.proposal_sections(id) on delete set null,
  project_id      uuid        not null references public.projects(id) on delete cascade,
  sort_order      integer     not null default 0
);

-- Saved quote configurations
create table public.proposal_quotes (
  id                      uuid        primary key default gen_random_uuid(),
  proposal_id             uuid        not null references public.proposals(id) on delete cascade,
  label                   text        not null default 'FNA Quote',
  is_locked               boolean     not null default false,
  is_fna_quote            boolean     not null default true,
  quote_type              text        not null default 'build',
  selected_addons         jsonb       not null default '{}',
  slider_values           jsonb       not null default '{}',
  tier_selections         jsonb       not null default '{}',
  location_days           jsonb       not null default '{}',
  photo_count             integer     not null default 25,
  crowdfunding_enabled    boolean     not null default false,
  crowdfunding_tier       integer     not null default 0,
  fundraising_enabled     boolean     not null default false,
  defer_payment           boolean     not null default false,
  friendly_discount_pct   integer     not null default 0,
  total_amount            integer,
  down_amount             integer,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Proposal view tracking
create table public.proposal_views (
  id              uuid        primary key default gen_random_uuid(),
  proposal_id     uuid        not null references public.proposals(id) on delete cascade,
  viewer_email    text,
  ip_address      text,
  user_agent      text,
  viewed_at       timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.content_snippets enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_sections enable row level security;
alter table public.proposal_videos enable row level security;
alter table public.proposal_projects enable row level security;
alter table public.proposal_quotes enable row level security;
alter table public.proposal_views enable row level security;

-- Admin (authenticated) full access on all tables
create policy "admin full access" on public.content_snippets for all to authenticated using (true) with check (true);
create policy "admin full access" on public.proposals for all to authenticated using (true) with check (true);
create policy "admin full access" on public.proposal_sections for all to authenticated using (true) with check (true);
create policy "admin full access" on public.proposal_videos for all to authenticated using (true) with check (true);
create policy "admin full access" on public.proposal_projects for all to authenticated using (true) with check (true);
create policy "admin full access" on public.proposal_quotes for all to authenticated using (true) with check (true);
create policy "admin full access" on public.proposal_views for all to authenticated using (true) with check (true);

-- Anon read access for public proposal pages (password check in app layer)
create policy "anon read proposals" on public.proposals for select to anon using (status != 'draft');
create policy "anon read sections" on public.proposal_sections for select to anon using (true);
create policy "anon read videos" on public.proposal_videos for select to anon using (true);
create policy "anon read projects" on public.proposal_projects for select to anon using (true);
create policy "anon read quotes" on public.proposal_quotes for select to anon using (true);

-- Anon can insert views and create/update their own (non-FNA) quotes
create policy "anon insert views" on public.proposal_views for insert to anon with check (true);
create policy "anon insert quotes" on public.proposal_quotes for insert to anon with check (is_fna_quote = false);
create policy "anon update quotes" on public.proposal_quotes for update to anon using (is_fna_quote = false) with check (is_fna_quote = false);
