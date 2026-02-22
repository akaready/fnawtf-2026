-- Add preview gif and assets delivered to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS preview_gif_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assets_delivered TEXT[];

-- Testimonials table (linked to projects, can also be standalone)
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  person_name TEXT,
  person_title TEXT,
  company TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Behind-the-scenes images table
CREATE TABLE IF NOT EXISTS project_bts_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_testimonials_project_id ON testimonials(project_id);
CREATE INDEX IF NOT EXISTS idx_bts_images_project_id ON project_bts_images(project_id);
