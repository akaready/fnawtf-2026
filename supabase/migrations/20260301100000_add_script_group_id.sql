-- Add script_group_id to link versions of the same script together
ALTER TABLE scripts ADD COLUMN script_group_id uuid DEFAULT gen_random_uuid();

-- Backfill existing scripts: each gets its own group
UPDATE scripts SET script_group_id = id WHERE script_group_id IS NULL;

-- Index for version picker queries
CREATE INDEX idx_scripts_group ON scripts(script_group_id);
