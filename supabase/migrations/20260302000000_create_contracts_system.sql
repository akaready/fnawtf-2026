-- ============================================================
-- CONTRACT MANAGEMENT SYSTEM
-- Templates, contracts, signers, and audit events
-- Integrated with clients, contacts, proposals, and quotes
-- ============================================================

-- Reusable contract templates with merge field definitions
create table public.contract_templates (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  description      text,
  contract_type    text        not null default 'sow',
  body             text        not null default '',
  merge_fields     jsonb       not null default '[]',
  is_active        boolean     not null default true,
  sort_order       integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Contract instances (created from templates or from scratch)
create table public.contracts (
  id                      uuid        primary key default gen_random_uuid(),
  contract_number         serial,
  template_id             uuid        references public.contract_templates(id) on delete set null,
  title                   text        not null,
  contract_type           text        not null default 'sow',
  status                  text        not null default 'draft',

  -- Linked records
  client_id               uuid        references public.clients(id) on delete set null,
  contact_id              uuid        references public.contacts(id) on delete set null,
  proposal_id             uuid        references public.proposals(id) on delete set null,
  quote_id                uuid        references public.proposal_quotes(id) on delete set null,

  -- Contract content (merge fields resolved at creation)
  body                    text        not null default '',
  manual_fields           jsonb       not null default '{}',

  -- SignWell integration
  signwell_document_id    text        unique,
  signwell_status         text,
  signwell_signed_at      timestamptz,
  signwell_expires_at     timestamptz,

  -- Metadata
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Contract signers (who needs to sign)
create table public.contract_signers (
  id                   uuid        primary key default gen_random_uuid(),
  contract_id          uuid        not null references public.contracts(id) on delete cascade,
  contact_id           uuid        references public.contacts(id) on delete set null,
  name                 text        not null,
  email                text        not null,
  role                 text        not null default 'signer',
  sort_order           integer     not null default 0,
  signwell_signer_id   text,
  status               text        not null default 'pending',
  signed_at            timestamptz,
  viewed_at            timestamptz,
  created_at           timestamptz not null default now()
);

-- Immutable audit log for contract events
create table public.contract_events (
  id              uuid        primary key default gen_random_uuid(),
  contract_id     uuid        not null references public.contracts(id) on delete cascade,
  event_type      text        not null,
  actor_email     text,
  signer_email    text,
  metadata        jsonb       not null default '{}',
  occurred_at     timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.contract_templates enable row level security;
alter table public.contracts          enable row level security;
alter table public.contract_signers   enable row level security;
alter table public.contract_events    enable row level security;

-- Admin (authenticated) full access on all tables
create policy "admin full access" on public.contract_templates for all to authenticated using (true) with check (true);
create policy "admin full access" on public.contracts          for all to authenticated using (true) with check (true);
create policy "admin full access" on public.contract_signers   for all to authenticated using (true) with check (true);
create policy "admin full access" on public.contract_events    for all to authenticated using (true) with check (true);
