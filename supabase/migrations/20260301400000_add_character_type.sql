-- Add character_type column to script_characters
ALTER TABLE script_characters
  ADD COLUMN character_type text NOT NULL DEFAULT 'actor';
