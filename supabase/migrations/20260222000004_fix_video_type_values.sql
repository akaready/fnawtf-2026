-- Remove erroneous 'broadcast' video_type values (should be flagship, cutdown, or bts)
UPDATE project_videos SET video_type = 'cutdown' WHERE video_type = 'broadcast';

-- Drop and recreate the check constraint with correct values
ALTER TABLE project_videos DROP CONSTRAINT IF EXISTS project_videos_video_type_check;
ALTER TABLE project_videos
  ADD CONSTRAINT project_videos_video_type_check
  CHECK (video_type IN ('flagship', 'cutdown', 'bts'));
