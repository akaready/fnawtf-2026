-- Move per-quote options from proposals table to proposal_quotes
ALTER TABLE proposal_quotes
  ADD COLUMN IF NOT EXISTS hide_deferred_payment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS force_priority_scheduling boolean NOT NULL DEFAULT false;
