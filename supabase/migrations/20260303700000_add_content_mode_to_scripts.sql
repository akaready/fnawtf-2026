-- Add content_mode column to distinguish scratchpad vs table versions
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS content_mode TEXT NOT NULL DEFAULT 'table'
  CHECK (content_mode IN ('table', 'scratchpad'));
