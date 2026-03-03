-- Add structured versioning: major.minor + published flag
-- Internal drafts: v00.01, v00.02, etc.
-- Published (client-visible): v01, v02, etc.

ALTER TABLE scripts ADD COLUMN major_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scripts ADD COLUMN minor_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE scripts ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing scripts become draft v00.{version}
UPDATE scripts SET major_version = 0, minor_version = version;

-- Index for version queries within a group
CREATE INDEX idx_scripts_major_version ON scripts(script_group_id, major_version, minor_version);
