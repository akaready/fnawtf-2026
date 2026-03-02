-- ============================================================
-- GLOBAL LOCATIONS DATABASE
-- Locations library, images, project links, script integration
-- ============================================================

-- Main locations table
CREATE TABLE public.locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  google_maps_url TEXT,
  featured_image  TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),

  -- Peerspace integration
  peerspace_url   TEXT,
  peerspace_id    TEXT,
  peerspace_data  JSONB DEFAULT '{}',

  -- Metadata
  tags            TEXT[] DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_peerspace ON locations(peerspace_id) WHERE peerspace_id IS NOT NULL;

-- Location images (gallery + reference images)
CREATE TABLE public.location_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  storage_path  TEXT,
  alt_text      TEXT,
  source        TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (source IN ('uploaded', 'peerspace')),
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_location_images_location ON location_images(location_id);

-- Junction: locations <-> projects
CREATE TABLE public.location_projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(location_id, project_id)
);

CREATE INDEX idx_location_projects_location ON location_projects(location_id);
CREATE INDEX idx_location_projects_project ON location_projects(project_id);

-- Link script locations to global locations
ALTER TABLE script_locations
  ADD COLUMN global_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE locations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_projects  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access locations"
  ON locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access location_images"
  ON location_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access location_projects"
  ON location_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage bucket for location images
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-images', 'location-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated upload location images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'location-images');

CREATE POLICY "Authenticated update location images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'location-images');

CREATE POLICY "Authenticated delete location images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'location-images');

CREATE POLICY "Public read location images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'location-images');
