-- Add description field to proposal_milestones for rich timeline display
alter table public.proposal_milestones
  add column description text;
