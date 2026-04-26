-- Proposal versioning: groups of related proposals that share a slug & proposal_number,
-- distinguished by version_number. Each version is a full snapshot with its own child rows.

ALTER TABLE proposals
  ADD COLUMN proposal_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN version_number int NOT NULL DEFAULT 1,
  ADD COLUMN version_name text,
  ADD COLUMN is_published_version boolean NOT NULL DEFAULT true;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_group_version_unique UNIQUE (proposal_group_id, version_number);

CREATE INDEX proposals_group_idx ON proposals(proposal_group_id);
CREATE INDEX proposals_slug_version_idx ON proposals(slug, version_number);
