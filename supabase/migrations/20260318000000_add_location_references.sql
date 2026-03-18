ALTER TABLE script_locations ADD COLUMN location_mode TEXT NOT NULL DEFAULT 'place';

CREATE TABLE script_location_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES script_locations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_script_location_references_location_id
  ON script_location_references(location_id);
