-- Layout snapshots: save/restore website project placement arrangements
create table public.website_layout_snapshots (
  id           uuid        primary key default gen_random_uuid(),
  label        text,
  created_by   text        not null,
  placements   jsonb       not null default '[]',
  created_at   timestamptz not null default now()
);

create index idx_layout_snapshots_created_at
  on public.website_layout_snapshots (created_at desc);

alter table public.website_layout_snapshots enable row level security;

create policy "Authenticated users can manage snapshots"
  on public.website_layout_snapshots
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
