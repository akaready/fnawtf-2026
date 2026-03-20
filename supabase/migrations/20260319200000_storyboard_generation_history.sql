-- Storyboard generation history: allow multiple frames per beat, track which is active

-- Mark which frame is displayed in the table (one active per beat)
ALTER TABLE script_storyboard_frames
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Store the exact reference images used for each generation
ALTER TABLE script_storyboard_frames
  ADD COLUMN reference_urls_used jsonb DEFAULT '[]'::jsonb;

-- Enforce: at most one active frame per beat
CREATE UNIQUE INDEX idx_storyboard_frames_active_beat
  ON script_storyboard_frames (beat_id)
  WHERE is_active = true AND beat_id IS NOT NULL;

-- Enforce: at most one active frame per scene
CREATE UNIQUE INDEX idx_storyboard_frames_active_scene
  ON script_storyboard_frames (scene_id)
  WHERE is_active = true AND scene_id IS NOT NULL;
