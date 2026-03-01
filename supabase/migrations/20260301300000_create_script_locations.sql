-- Script locations library (tracked locations per script)
CREATE TABLE script_locations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id   UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_script_locations_script ON script_locations (script_id);

ALTER TABLE script_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_script_locations" ON script_locations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add location FK to scenes
ALTER TABLE script_scenes
  ADD COLUMN location_id UUID REFERENCES script_locations(id) ON DELETE SET NULL;
