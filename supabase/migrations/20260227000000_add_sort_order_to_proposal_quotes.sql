alter table proposal_quotes add column if not exists sort_order integer not null default 0;

-- Backfill existing quotes with order based on created_at
with ordered as (
  select id, row_number() over (partition by proposal_id order by created_at) - 1 as rn
  from proposal_quotes
)
update proposal_quotes
set sort_order = ordered.rn
from ordered
where proposal_quotes.id = ordered.id;
