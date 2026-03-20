ALTER TABLE script_shares
  ADD COLUMN snapshot_script_id UUID REFERENCES scripts(id) NULL,
  ADD COLUMN snapshot_major_version INT NULL;
