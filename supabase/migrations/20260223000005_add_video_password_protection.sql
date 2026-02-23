-- Drop old check constraint and re-add with 'pitch' included
ALTER TABLE project_videos
  DROP CONSTRAINT project_videos_video_type_check;

ALTER TABLE project_videos
  ADD CONSTRAINT project_videos_video_type_check
  CHECK (video_type = ANY (ARRAY['flagship'::text, 'cutdown'::text, 'bts'::text, 'pitch'::text]));

-- Add password protection columns
ALTER TABLE project_videos
  ADD COLUMN IF NOT EXISTS password_protected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS viewer_password text;
