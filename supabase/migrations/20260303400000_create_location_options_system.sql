-- Location Options system: multiple global locations per script location (mirrors cast system)

-- Junction table: script_location_options (mirrors script_character_cast)
CREATE TABLE script_location_options (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_location_id  UUID NOT NULL REFERENCES script_locations(id) ON DELETE CASCADE,
  location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  slot_order          INTEGER NOT NULL DEFAULT 0,
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  appearance_prompt   TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (script_location_id, location_id)
);

ALTER TABLE script_location_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage location options"
  ON script_location_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add color to script_locations (mirrors script_characters.color)
ALTER TABLE script_locations ADD COLUMN color TEXT NOT NULL DEFAULT '#38bdf8';

-- Add appearance_prompt to global locations (dual-write target, mirrors contacts.appearance_prompt)
ALTER TABLE locations ADD COLUMN appearance_prompt TEXT;
