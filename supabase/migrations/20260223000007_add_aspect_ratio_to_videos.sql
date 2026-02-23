-- Add aspect_ratio to project_videos
-- Stores the display aspect ratio of the video (e.g. '16:9', '9:16', '1:1')

ALTER TABLE project_videos
  ADD COLUMN IF NOT EXISTS aspect_ratio text NOT NULL DEFAULT '16:9';

ALTER TABLE project_videos
  ADD CONSTRAINT project_videos_aspect_ratio_check
  CHECK (aspect_ratio = ANY (ARRAY['16:9'::text, '9:16'::text, '1:1'::text, '4:3'::text, '21:9'::text]));
