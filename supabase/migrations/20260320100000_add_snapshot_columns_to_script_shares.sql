ALTER TABLE script_shares
  ADD COLUMN snapshot_script_id UUID REFERENCES scripts(id) ON DELETE SET NULL NULL,
  ADD COLUMN snapshot_major_version INT NULL;

CREATE INDEX IF NOT EXISTS idx_script_shares_snapshot
  ON script_shares(snapshot_script_id)
  WHERE snapshot_script_id IS NOT NULL;
