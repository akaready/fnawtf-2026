-- Track which mode each character uses for storyboard generation
ALTER TABLE script_characters ADD COLUMN cast_mode TEXT NOT NULL DEFAULT 'people';

-- Reference images uploaded directly to a character (used when no person is selected)
CREATE TABLE script_character_references (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id  UUID NOT NULL REFERENCES script_characters(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_script_character_references_character_id ON script_character_references(character_id);
