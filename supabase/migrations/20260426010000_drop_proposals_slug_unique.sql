-- Versioning requires multiple proposals to share a slug (one row per version).
-- Drop the legacy per-row UNIQUE constraint on slug.
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_slug_key;
