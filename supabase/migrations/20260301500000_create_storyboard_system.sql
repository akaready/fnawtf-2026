-- Storyboard generation system: styles, style references, and storyboard frames

-- Per-script style configuration
CREATE TABLE script_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  prompt text NOT NULL DEFAULT '',
  aspect_ratio text NOT NULL DEFAULT '16:9',
  generation_mode text NOT NULL DEFAULT 'beat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(script_id)
);

ALTER TABLE script_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON script_styles
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Style reference images (uploaded by user for style guidance)
CREATE TABLE script_style_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  style_id uuid NOT NULL REFERENCES script_styles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE script_style_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON script_style_references
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Storyboard frames (one per beat or scene)
CREATE TABLE script_storyboard_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  beat_id uuid REFERENCES script_beats(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES script_scenes(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  source text NOT NULL DEFAULT 'generated',
  prompt_used text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_storyboard_frames_beat ON script_storyboard_frames(beat_id);
CREATE INDEX idx_storyboard_frames_scene ON script_storyboard_frames(scene_id);
CREATE INDEX idx_storyboard_frames_script ON script_storyboard_frames(script_id);

ALTER TABLE script_storyboard_frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON script_storyboard_frames
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
