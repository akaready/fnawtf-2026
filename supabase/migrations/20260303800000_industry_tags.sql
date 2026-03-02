-- Convert clients.industry from text to text[]
-- Preserves existing data as single-element arrays
ALTER TABLE clients
  ALTER COLUMN industry TYPE text[]
  USING CASE WHEN industry IS NULL THEN NULL ELSE ARRAY[industry] END;
