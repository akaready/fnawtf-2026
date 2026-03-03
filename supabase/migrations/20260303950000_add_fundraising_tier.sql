-- Add fundraising_tier column to proposal_quotes
-- Stores the selected fundraising payment tier (0-4, default 0)
-- 0 = 100% pre-raise, 1 = 80%, 2 = 60%, 3 = 40%, 4 = 20%
ALTER TABLE proposal_quotes
  ADD COLUMN IF NOT EXISTS fundraising_tier integer NOT NULL DEFAULT 0;
