-- Add is_campaign flag to projects table
-- When true, all non-BTS project_videos are shown on the project detail page
ALTER TABLE projects ADD COLUMN is_campaign boolean NOT NULL DEFAULT false;
