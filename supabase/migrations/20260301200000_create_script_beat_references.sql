-- Reference images attached to script beats
CREATE TABLE script_beat_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id uuid NOT NULL REFERENCES script_beats(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_beat_references_beat ON script_beat_references(beat_id);

ALTER TABLE script_beat_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON script_beat_references
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
