-- Junction table linking script characters to cast contacts (from contacts table)
CREATE TABLE script_character_cast (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id    UUID NOT NULL REFERENCES script_characters(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  slot_order      INTEGER NOT NULL DEFAULT 0,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  appearance_prompt TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (character_id, contact_id)
);

CREATE INDEX idx_char_cast_character ON script_character_cast(character_id);
CREATE INDEX idx_char_cast_contact ON script_character_cast(contact_id);

ALTER TABLE script_character_cast ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_script_character_cast" ON script_character_cast
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Track how many cast slots each character shows in the UI
ALTER TABLE script_characters ADD COLUMN max_cast_slots INTEGER NOT NULL DEFAULT 3;
