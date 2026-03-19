-- Scene description: short 1-3 word descriptor for each scene
ALTER TABLE script_scenes ADD COLUMN scene_description TEXT;

-- Share link mode: presentation (storyboard) or table (full script)
ALTER TABLE script_shares ADD COLUMN share_mode TEXT NOT NULL DEFAULT 'presentation';

-- Per-beat comments on shared scripts
CREATE TABLE script_share_comments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id      UUID NOT NULL REFERENCES script_shares(id) ON DELETE CASCADE,
  beat_id       TEXT NOT NULL,
  viewer_email  TEXT NOT NULL,
  viewer_name   TEXT,
  content       TEXT NOT NULL,
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_script_comments_share_beat ON script_share_comments(share_id, beat_id);

-- RLS
ALTER TABLE script_share_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth full" ON script_share_comments FOR ALL TO authenticated USING (true);
CREATE POLICY "anon read active" ON script_share_comments FOR SELECT TO anon USING (deleted_at IS NULL);
CREATE POLICY "anon insert" ON script_share_comments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update own" ON script_share_comments FOR UPDATE TO anon USING (deleted_at IS NULL) WITH CHECK (true);
