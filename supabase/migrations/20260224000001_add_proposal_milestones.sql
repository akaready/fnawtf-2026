-- ============================================================
-- PROPOSAL MILESTONES (production schedule)
-- ============================================================

create table public.proposal_milestones (
  id              uuid        primary key default gen_random_uuid(),
  proposal_id     uuid        not null references public.proposals(id) on delete cascade,
  label           text        not null,
  start_date      date        not null,
  end_date        date        not null,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.proposal_milestones enable row level security;

create policy "admin full access" on public.proposal_milestones for all to authenticated using (true) with check (true);
create policy "anon read milestones" on public.proposal_milestones for select to anon using (true);

-- Schedule date range on proposals
alter table public.proposals
  add column schedule_start_date date,
  add column schedule_end_date date;
